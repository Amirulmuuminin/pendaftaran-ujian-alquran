"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import useDataStore from "../../store";
import { Penguji } from "../../types";
import {
  PengujiCard,
  PengujiScheduleSelector,
} from "../../components/features";
import { Plus, UserPlus, X, List, BookOpen, UserCheck, AlertTriangle, Settings } from "lucide-react";
import { Dialog } from "../../components/ui";

type ExamType = 'full' | 'half';

export default function PengujiPage() {
  const router = useRouter();
  const { pengujis, loadPengujis, addPenguji, updatePenguji, deletePenguji } =
    useDataStore();
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPenguji, setEditingPenguji] = useState<Penguji | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [pengujiName, setPengujiName] = useState("");
  const [pengujiSchedule, setPengujiSchedule] = useState("{}");
  const [supportedExamTypes, setSupportedExamTypes] = useState<ExamType[]>(['full', 'half']);
  const [maxExamsPerDay, setMaxExamsPerDay] = useState<string>("");

  useEffect(() => {
    loadPengujis().then(() => setLoading(false));
  }, []);

  const handleAdd = () => {
    setEditingPenguji(null);
    setPengujiName("");
    setPengujiSchedule("{}");
    setSupportedExamTypes(['full', 'half']);
    setMaxExamsPerDay("");
    setIsDialogOpen(true);
  };

  const handleEdit = (penguji: Penguji) => {
    setEditingPenguji(penguji);
    setPengujiName(penguji.name);
    setPengujiSchedule(penguji.schedule);
    try {
      const types = JSON.parse(penguji.supported_exam_types);
      setSupportedExamTypes(types);
    } catch {
      setSupportedExamTypes(['full', 'half']);
    }
    setMaxExamsPerDay(penguji.max_exams_per_day ? String(penguji.max_exams_per_day) : '');
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pengujiName.trim()) {
      toast.error("Nama penguji wajib diisi.");
      return;
    }
    if (supportedExamTypes.length === 0) {
      toast.error("Pilih minimal satu tipe ujian yang dapat ditangani.");
      return;
    }

    // Parse max_exams_per_day value
    const maxExamsPerDayNum = maxExamsPerDay.trim() === '' ? null : parseInt(maxExamsPerDay);
    if (maxExamsPerDayNum !== null && (isNaN(maxExamsPerDayNum) || maxExamsPerDayNum < 1)) {
      toast.error("Ujian maksimal perhari harus berupa angka positif.");
      return;
    }

    try {
      if (editingPenguji) {
        await updatePenguji(editingPenguji.id, {
          name: pengujiName.trim(),
          schedule: pengujiSchedule,
          supported_exam_types: JSON.stringify(supportedExamTypes),
          max_exams_per_day: maxExamsPerDayNum,
        });
        toast.success("Penguji berhasil diperbarui!");
      } else {
        await addPenguji({
          name: pengujiName.trim(),
          schedule: pengujiSchedule,
          supported_exam_types: JSON.stringify(supportedExamTypes),
          max_exams_per_day: maxExamsPerDayNum,
        });
        toast.success("Penguji berhasil ditambahkan!");
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast.error("Gagal menyimpan data.");
    }
  };

  const handleDelete = async (pengujiId: string) => {
    try {
      await deletePenguji(pengujiId);
      setDeleteConfirmId(null);
      toast.success("Penguji berhasil dihapus!");
    } catch (error) {
      toast.error("Gagal menghapus penguji.");
    }
  };

  const handleNavigateToHome = () => {
    router.push("/");
  };

  const handleNavigateToExams = () => {
    router.push("/semua-ujian");
  };

  const handleNavigateToDeteksiMasalah = () => {
    router.push("/deteksi-masalah");
  };

  const handleNavigateToBackup = () => {
    router.push("/backup");
  };

  if (loading) return <div className="text-center py-12">Memuat data...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-4 pb-20">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Kelola Penguji</h1>
        <p className="text-sm text-gray-600 mt-1">
          {pengujis.length} penguji terdaftar
        </p>
      </div>

      <button
        onClick={handleAdd}
        className="fixed bottom-24 right-6 bg-purple-600 hover:bg-purple-700 text-white rounded-full p-4 shadow-lg z-10"
      >
        <Plus size={24} />
      </button>

      {pengujis.length === 0 ? (
        <div className="text-center py-16">
          <UserPlus size={64} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-600">
            Belum Ada Penguji
          </h3>
          <p className="text-sm text-gray-500 mt-2">
            Tekan tombol + untuk menambahkan penguji baru
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pengujis.map((penguji) => (
            <PengujiCard
              key={penguji.id}
              penguji={penguji}
              onEdit={handleEdit}
              onDelete={setDeleteConfirmId}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={editingPenguji ? "Edit Penguji" : "Tambah Penguji Baru"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Penguji
            </label>
            <input
              type="text"
              value={pengujiName}
              onChange={(e) => setPengujiName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Contoh: Ustadz Ahmad"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jadwal Penguji
            </label>
            <PengujiScheduleSelector
              schedule={pengujiSchedule}
              onScheduleChange={setPengujiSchedule}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipe Ujian yang Dapat Ditangani
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={supportedExamTypes.includes('full')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSupportedExamTypes([...supportedExamTypes, 'full']);
                    } else {
                      setSupportedExamTypes(supportedExamTypes.filter(t => t !== 'full'));
                    }
                  }}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">1 Juz (Full)</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={supportedExamTypes.includes('half')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSupportedExamTypes([...supportedExamTypes, 'half']);
                    } else {
                      setSupportedExamTypes(supportedExamTypes.filter(t => t !== 'half'));
                    }
                  }}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">1/2 Juz</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ujian Maksimal Perhari (Opsional)
            </label>
            <input
              type="number"
              min="1"
              value={maxExamsPerDay}
              onChange={(e) => setMaxExamsPerDay(e.target.value)}
              placeholder="Kosongkan untuk tidak ada batas"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Jika diisi, slot akan tertutup otomatis jika batas tercapai
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => setIsDialogOpen(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              {editingPenguji ? "Simpan Perubahan" : "Tambah Penguji"}
            </button>
          </div>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        title="Hapus Penguji?"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Apakah Anda yakin ingin menghapus penguji ini? Semua ujian yang
            terhubung dengan penguji ini akan dikosongkan.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setDeleteConfirmId(null)}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Hapus
            </button>
          </div>
        </div>
      </Dialog>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-around">
            <button
              onClick={handleNavigateToHome}
              className="flex flex-col items-center py-3 px-4 min-w-0 flex-1 transition-colors text-gray-500 hover:text-gray-700"
            >
              <List size={24} />
              <span className="text-xs mt-1 font-medium">Daftar Kelas</span>
            </button>
            <button className="flex flex-col items-center py-3 px-4 min-w-0 flex-1 transition-colors text-blue-600">
              <UserCheck size={24} />
              <span className="text-xs mt-1 font-medium">Penguji</span>
            </button>
            <button
              onClick={handleNavigateToExams}
              className="flex flex-col items-center py-3 px-4 min-w-0 flex-1 transition-colors text-gray-500 hover:text-gray-700"
            >
              <BookOpen size={24} />
              <span className="text-xs mt-1 font-medium">Semua Ujian</span>
            </button>
            <button
              onClick={handleNavigateToDeteksiMasalah}
              className="flex flex-col items-center py-3 px-4 min-w-0 flex-1 transition-colors text-gray-500 hover:text-gray-700"
            >
              <AlertTriangle size={24} />
              <span className="text-xs mt-1 font-medium">Deteksi Masalah</span>
            </button>
            <button
              onClick={handleNavigateToBackup}
              className="flex flex-col items-center py-3 px-4 min-w-0 flex-1 transition-colors text-gray-500 hover:text-gray-700"
            >
              <Settings size={24} />
              <span className="text-xs mt-1 font-medium">Backup</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}

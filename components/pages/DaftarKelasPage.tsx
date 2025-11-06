import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import useDataStore from "../../store";
import { ClassData, scheduleDays, scheduleSlots } from "../../types";
import { Button, Dialog, Input } from "../ui";
import { ClassCard } from "../features";
import { Plus, Users, Clock } from "lucide-react";

interface DaftarKelasPageProps {
  onViewDetail: (classId: string) => void;
}

const DaftarKelasPage: React.FC<DaftarKelasPageProps> = ({ onViewDetail }) => {
  const {
    classes,
    deleteClass,
    addClass,
    addClassOptimized,
    updateClass,
    loading,
  } = useDataStore();

  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [isEditClassOpen, setIsEditClassOpen] = useState(false);
  const [classToEdit, setClassToEdit] = useState<ClassData | null>(null);
  const [className, setClassName] = useState("");
  const [selectedSchedule, setSelectedSchedule] = useState<Record<string, number[]>>({});

  const handleAddClass = () => {
    setClassToEdit(null);
    setClassName("");
    setSelectedSchedule({});
    setIsAddClassOpen(true);
  };

  const handleEditClass = (classItem: ClassData) => {
    setClassToEdit(classItem);
    setClassName(classItem.name);
    try {
      const scheduleData = JSON.parse(classItem.schedule);
      setSelectedSchedule(scheduleData);
    } catch {
      setSelectedSchedule({});
    }
    setIsEditClassOpen(true);
  };

  const handleDeleteClass = async (classId: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus kelas ini? Semua data murid dan ujian akan hilang.")) {
      await deleteClass(classId);
      toast.success("Kelas berhasil dihapus!");
    }
  };

  const toggleScheduleSlot = (day: string, slot: number) => {
    setSelectedSchedule(prev => {
      const updated = { ...prev };
      if (!updated[day]) {
        updated[day] = [];
      }

      const index = updated[day].indexOf(slot);
      if (index > -1) {
        updated[day] = updated[day].filter(s => s !== slot);
        if (updated[day].length === 0) {
          delete updated[day];
        }
      } else {
        updated[day] = [...updated[day], slot].sort();
      }

      return updated;
    });
  };

  const handleSubmitClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim()) {
      toast.error("Nama Kelas wajib diisi.");
      return;
    }

    for (const day of scheduleDays) {
      const slots = selectedSchedule[day] || [];
      if (slots.length < 2 || slots.length > 3) {
        toast.error(`Pilih 2-3 jam pelajaran Qur'an untuk setiap hari. Periksa kembali hari ${day}.`);
        return;
      }
    }

    const classData = {
      name: className.trim(),
      schedule: JSON.stringify(selectedSchedule),
    };

    try {
      if (classToEdit) {
        await updateClass(classToEdit.id, classData);
        toast.success("Kelas berhasil diperbarui!");
      } else {
        const newClass = await addClassOptimized(classData);
        if (newClass) {
          toast.success("Kelas baru berhasil ditambahkan!");
        } else {
          toast.error("Gagal menambahkan kelas.");
        }
      }

      setIsAddClassOpen(false);
      setIsEditClassOpen(false);
      setClassName("");
      setSelectedSchedule({});
    } catch (error) {
      toast.error("Gagal menyimpan kelas. Silakan coba lagi.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Daftar Kelas</h2>
      </div>

      {classes.length === 0 ? (
        <div className="text-center py-16">
          <Users size={64} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            Belum Ada Kelas
          </h3>
          <p className="text-gray-500 mb-2">
            Mulai dengan membuat kelas baru untuk mengelola murid-murid Anda.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Total {classes.length} kelas tersedia
          </p>
          {classes.map((classItem) => (
            <ClassCard
              key={classItem.id}
              classItem={classItem}
              onEdit={handleEditClass}
              onDelete={handleDeleteClass}
              onViewDetail={onViewDetail}
            />
          ))}
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={handleAddClass}
        className="fixed bottom-24 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-105 z-40"
      >
        <Plus size={24} />
      </button>

      {/* Add/Edit Class Dialog */}
      <Dialog
        isOpen={isAddClassOpen || isEditClassOpen}
        onClose={() => {
          setIsAddClassOpen(false);
          setIsEditClassOpen(false);
          setClassName("");
          setSelectedSchedule({});
        }}
        title={classToEdit ? "Edit Kelas" : "Tambah Kelas Baru"}
      >
        <form onSubmit={handleSubmitClass}>
          <div className="space-y-4">
            <Input
              label="Nama Kelas"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="Masukkan nama kelas"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Clock className="inline w-4 h-4 mr-1" />
                Jadwal Pelajaran Qur'an (Pilih 2-3 jam per hari)
              </label>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {scheduleDays.map((day) => (
                  <div key={day} className="border border-gray-200 rounded-lg p-3">
                    <h4 className="font-medium text-gray-900 mb-2">{day}</h4>
                    <div className="grid grid-cols-5 gap-2">
                      {scheduleSlots.map((slot) => (
                        <button
                          key={`${day}-${slot.value}`}
                          type="button"
                          onClick={() => toggleScheduleSlot(day, slot.value)}
                          className={`p-2 text-xs rounded transition-colors ${
                            selectedSchedule[day]?.includes(slot.value)
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {slot.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Total terpilih: {Object.values(selectedSchedule).reduce((sum, slots) => sum + slots.length, 0)} jam
              </p>
            </div>
          </div>

          <div className="pt-4">
            <Button type="submit" className="w-full">
              {classToEdit ? "Simpan Perubahan" : "Buat Kelas"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};

export default DaftarKelasPage;
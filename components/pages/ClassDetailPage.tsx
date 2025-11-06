import React, { useState, useMemo } from "react";
import { toast } from "sonner";
import useDataStore from "../../store";
import { Student, Exam, juzRanges } from "../../types";
import { Button, Dialog, Input, ConfirmDialog } from "../ui";
import { StudentCard } from "../features";
import {
  Plus,
  Users,
  BookOpen,
} from "lucide-react";

interface ClassDetailPageProps {
  classId: string;
  onBack: () => void;
}

const ClassDetailPage: React.FC<ClassDetailPageProps> = ({ classId, onBack }) => {
  const {
    classes,
    deleteClass,
    addStudent,
    updateStudent,
    deleteStudent,
    addExam,
    deleteExam,
    findClass,
    loading,
  } = useDataStore();

  const classItem = useMemo(() => findClass(classId), [findClass, classId]);

  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isEditStudentOpen, setIsEditStudentOpen] = useState(false);
  const [isExamRegistrationOpen, setIsExamRegistrationOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [confirmDeleteClass, setConfirmDeleteClass] = useState(false);
  const [confirmDeleteStudentId, setConfirmDeleteStudentId] = useState<string | null>(null);

  // Form states for student registration
  const [studentName, setStudentName] = useState("");
  const [registrationTypeTab, setRegistrationTypeTab] = useState<'non-5juz' | '5juz'>('non-5juz');
  const [examDetail, setExamDetail] = useState("");
  const [juzRange, setJuzRange] = useState("");
  const [notes, setNotes] = useState("");

  // Form states for exam registration (existing student)
  const [examTypeTab, setExamTypeTab] = useState<'non-5juz' | '5juz'>('non-5juz');

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!classItem) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Kelas tidak ditemukan.</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Kembali
        </button>
      </div>
    );
  }

  const handleAddStudent = () => {
    setStudentToEdit(null);
    setStudentName("");
    setRegistrationTypeTab('non-5juz');
    setExamDetail("");
    setJuzRange("");
    setNotes("");
    setIsAddStudentOpen(true);
  };

  const handleEditStudent = (student: Student) => {
    setStudentToEdit(student);
    setStudentName(student.name);
    setIsEditStudentOpen(true);
  };

  const handleDeleteStudent = (studentId: string) => {
    setConfirmDeleteStudentId(studentId);
  };

  const handleAddExamClick = (student: Student) => {
    setSelectedStudent(student);
    setExamTypeTab('non-5juz');
    setExamDetail("");
    setJuzRange("");
    setNotes("");
    setIsExamRegistrationOpen(true);
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) {
      toast.error("Nama murid wajib diisi.");
      return;
    }

    try {
      if (studentToEdit) {
        await updateStudent(classId, studentToEdit.id, studentName.trim());
        toast.success("Murid berhasil diperbarui!");
        setIsAddStudentOpen(false);
        setIsEditStudentOpen(false);
        setStudentName("");
      } else {
        // Validasi formulir pendaftaran murid baru
        if (registrationTypeTab === 'non-5juz') {
          if (!examDetail.trim()) {
            toast.error("Detail ujian non-5 juz wajib diisi.");
            return;
          }
        } else {
          if (!juzRange) {
            toast.error("Pilih juz untuk ujian 5 juz.");
            return;
          }
        }

        // Tambah murid baru
        await addStudent(classId, studentName.trim());

        // Reload data untuk mendapatkan ID murid yang baru ditambahkan
        await useDataStore.getState().loadData();

        // Cari murid yang baru ditambahkan
        const updatedClass = findClass(classId);
        const newStudent = updatedClass?.students?.find(s => s.name === studentName.trim());

        if (newStudent) {
          // Daftarkan ujian untuk murid baru
          const examData = {
            exam_date: Math.floor(Date.now() / 1000),
            status: 'scheduled',
            exam_type: registrationTypeTab,
            score: undefined,
            juz_number: registrationTypeTab === '5juz' ? juzRange : examDetail,
            notes: notes.trim() || undefined,
          };

          await addExam(classId, newStudent.id, examData);
          toast.success("Murid baru berhasil ditambahkan dengan ujian!");
        } else {
          toast.success("Murid baru berhasil ditambahkan!");
        }

        setIsAddStudentOpen(false);
        setStudentName("");
        setRegistrationTypeTab('non-5juz');
        setExamDetail("");
        setJuzRange("");
        setNotes("");
      }
    } catch (error) {
      toast.error("Gagal menyimpan data. Silakan coba lagi.");
    }
  };

  const handleExamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      toast.error("Murid tidak dipilih.");
      return;
    }

    try {
      const examData = {
        exam_date: Math.floor(Date.now() / 1000),
        status: 'scheduled',
        exam_type: examTypeTab,
        score: undefined,
        juz_number: examTypeTab === '5juz' ? juzRange : examDetail,
        notes: notes.trim() || undefined,
      };

      await addExam(classId, selectedStudent.id, examData);
      toast.success("Ujian berhasil didaftarkan!");

      setIsExamRegistrationOpen(false);
      setSelectedStudent(null);
      setExamTypeTab('non-5juz');
      setExamDetail("");
      setJuzRange("");
      setNotes("");
    } catch (error) {
      toast.error("Gagal mendaftarkan ujian. Silakan coba lagi.");
    }
  };

  const handleConfirmDeleteClass = async () => {
    try {
      await deleteClass(classId);
      toast.success("Kelas berhasil dihapus!");
      onBack();
    } catch (error) {
      toast.error("Gagal menghapus kelas. Silakan coba lagi.");
    }
  };

  const handleConfirmDeleteStudent = async () => {
    if (confirmDeleteStudentId) {
      try {
        await deleteStudent(classId, confirmDeleteStudentId);
        setConfirmDeleteStudentId(null);
        toast.success("Murid berhasil dihapus!");
      } catch (error) {
        toast.error("Gagal menghapus murid. Silakan coba lagi.");
      }
    }
  };

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{classItem.name}</h1>
        <div className="flex items-center text-sm text-gray-600 mt-2">
          <Users size={16} className="mr-1" />
          <span>{classItem?.students?.length || 0} Murid Terdaftar</span>
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={handleAddStudent}
        className="fixed bottom-24 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-105 z-40"
      >
        <Plus size={24} />
      </button>

      {/* Students List */}
      {!classItem?.students || classItem.students.length === 0 ? (
        <div className="text-center py-16">
          <Users size={64} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            Belum Ada Murid
          </h3>
          <p className="text-gray-500">
            Mulai dengan menambahkan murid ke kelas ini.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {classItem.students.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              onAddExam={handleAddExamClick}
              onEditStudent={handleEditStudent}
              onDeleteStudent={handleDeleteStudent}
              onDeleteExam={async (examId) => {
                try {
                  await deleteExam(classId, student.id, examId);
                  toast.success("Ujian berhasil dihapus!");
                } catch (error) {
                  toast.error("Gagal menghapus ujian. Silakan coba lagi.");
                }
              }}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Student Dialog */}
      <Dialog
        isOpen={isAddStudentOpen || isEditStudentOpen}
        onClose={() => {
          setIsAddStudentOpen(false);
          setIsEditStudentOpen(false);
          setStudentName("");
          setRegistrationTypeTab('non-5juz');
          setExamDetail("");
          setJuzRange("");
          setNotes("");
        }}
        title={studentToEdit ? "Edit Murid" : "Daftarkan Murid"}
      >
        <form onSubmit={handleStudentSubmit}>
          <div className="space-y-4">
            <Input
              label="Nama Murid"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Contoh: Amir"
              required
            />

            {/* Form tambahan hanya untuk pendaftaran murid baru */}
            {!studentToEdit && (
              <>
                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                  <button
                    type="button"
                    onClick={() => setRegistrationTypeTab('non-5juz')}
                    className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
                      registrationTypeTab === 'non-5juz'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Non 5 Juz
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegistrationTypeTab('5juz')}
                    className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
                      registrationTypeTab === '5juz'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    5 Juz
                  </button>
                </div>

                {/* Tab Content */}
                {registrationTypeTab === 'non-5juz' ? (
                  <div>
                    <Input
                      label="Ujian"
                      value={examDetail}
                      onChange={(e) => setExamDetail(e.target.value)}
                      placeholder="Contoh: 1/2 ke-1 juz 1"
                      required
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pilih Juz
                    </label>
                    <select
                      value={juzRange}
                      onChange={(e) => setJuzRange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      required
                    >
                      <option value="">Pilih juz</option>
                      {juzRanges.map((range) => (
                        <option key={range.value} value={range.value}>
                          {range.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <Input
                  label="Catatan (opsional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Masukkan catatan jika diperlukan"
                />
              </>
            )}
          </div>
          <div className="pt-4">
            <Button type="submit" className="w-full">
              {studentToEdit ? "Simpan Perubahan" : "Daftarkan Murid"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Exam Registration Dialog */}
      <Dialog
        isOpen={isExamRegistrationOpen}
        onClose={() => {
          setIsExamRegistrationOpen(false);
          setSelectedStudent(null);
          setExamTypeTab('non-5juz');
          setExamDetail("");
          setJuzRange("");
          setNotes("");
        }}
        title={`Daftarkan Ujian - ${selectedStudent?.name}`}
      >
        <form onSubmit={handleExamSubmit}>
          <div className="space-y-4">
            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                type="button"
                onClick={() => setExamTypeTab('non-5juz')}
                className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
                  examTypeTab === 'non-5juz'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Non 5 Juz
              </button>
              <button
                type="button"
                onClick={() => setExamTypeTab('5juz')}
                className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
                  examTypeTab === '5juz'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                5 Juz
              </button>
            </div>

            {/* Tab Content */}
            {examTypeTab === 'non-5juz' ? (
              <div>
                <Input
                  label="Ujian"
                  value={examDetail}
                  onChange={(e) => setExamDetail(e.target.value)}
                  placeholder="Contoh: 1/2 ke-1 juz 1"
                  required
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pilih Juz
                </label>
                <select
                  value={juzRange}
                  onChange={(e) => setJuzRange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  required
                >
                  <option value="">Pilih juz</option>
                  {juzRanges.map((range) => (
                    <option key={range.value} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Input
              label="Catatan (opsional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Masukkan catatan jika diperlukan"
            />
          </div>

          <div className="pt-4">
            <Button type="submit" className="w-full">
              Daftarkan Ujian
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={confirmDeleteClass}
        onClose={() => setConfirmDeleteClass(false)}
        onConfirm={handleConfirmDeleteClass}
        title="Konfirmasi Hapus Kelas"
        message={`Apakah Anda yakin ingin menghapus kelas ${classItem.name}? Semua data murid dan ujian akan hilang. Tindakan ini tidak dapat dibatalkan.`}
      />

      <ConfirmDialog
        isOpen={!!confirmDeleteStudentId}
        onClose={() => setConfirmDeleteStudentId(null)}
        onConfirm={handleConfirmDeleteStudent}
        title="Konfirmasi Hapus Murid"
        message="Apakah Anda yakin ingin menghapus murid ini? Semua data ujian murid akan hilang."
      />
    </div>
  );
};

export default ClassDetailPage;
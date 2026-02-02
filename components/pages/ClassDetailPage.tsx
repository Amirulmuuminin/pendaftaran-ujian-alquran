import React, { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import useDataStore from "../../store";
import { Student, Exam, juzRanges, SlotSelection, JuzPortion } from "../../types";
import { JUZ_PORTION_TYPES, HALF_JUZ_SUFFIX } from "../../types/constants";
import { Button, Dialog, Input, ConfirmDialog } from "../ui";
import { StudentCard, ExamScheduleSelector, ExamDatePicker, ExamSlotSelector, MultiSlotSelector } from "../features";
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
    pengujis,
    deleteClass,
    addStudent,
    addStudentOptimized,
    updateStudent,
    deleteStudent,
    addExam,
    addExamOptimized,
    deleteExam,
    findClass,
    loading,
  } = useDataStore();

  const classItem = useMemo(() => findClass(classId), [findClass, classId, classes]);

  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isEditStudentOpen, setIsEditStudentOpen] = useState(false);
  const [isExamRegistrationOpen, setIsExamRegistrationOpen] = useState(false);
  const [isEditExamScheduleOpen, setIsEditExamScheduleOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [confirmDeleteClass, setConfirmDeleteClass] = useState(false);
  const [confirmDeleteStudentId, setConfirmDeleteStudentId] = useState<string | null>(null);

  // Form states for student registration
  const [studentName, setStudentName] = useState("");
  const [registrationTypeTab, setRegistrationTypeTab] = useState<'non-5juz' | '5juz'>('non-5juz');
  const [juzPortion, setJuzPortion] = useState<JuzPortion | undefined>(undefined);
  const [examDetail, setExamDetail] = useState("");
  const [juzRange, setJuzRange] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<SlotSelection | undefined>();
  const [selectedPenguji, setSelectedPenguji] = useState<string | undefined>();

  // Form states for exam registration (existing student)
  const [examTypeTab, setExamTypeTab] = useState<'non-5juz' | '5juz'>('non-5juz');
  const [examJuzPortion, setExamJuzPortion] = useState<JuzPortion | undefined>(undefined);
  const [examRegSlot, setExamRegSlot] = useState<SlotSelection | undefined>();
  const [examRegPenguji, setExamRegPenguji] = useState<string | undefined>();

  // Form states for 5 juz schedules (using SlotSelection)
  const [juzSlots, setJuzSlots] = useState<SlotSelection[]>([
    { dateKey: "", period: "" },
    { dateKey: "", period: "" },
    { dateKey: "", period: "" },
    { dateKey: "", period: "" },
    { dateKey: "", period: "" },
  ]);

  // Form state for editing exam schedule
  const [editExamNewSlot, setEditExamNewSlot] = useState<SlotSelection | undefined>(undefined);

  // Reset selected slot when juzPortion changes (student registration)
  useEffect(() => {
    if (selectedSlot) {
      setSelectedSlot(undefined);
    }
  }, [juzPortion]);

  // Reset examRegSlot when examJuzPortion changes (exam registration)
  useEffect(() => {
    if (examRegSlot) {
      setExamRegSlot(undefined);
    }
  }, [examJuzPortion]);

  // Get all exams for a class to check date conflicts
  const getAllClassExams = () => {
    return classItem?.students?.flatMap(student => student.exams || []) || [];
  };

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
    setJuzPortion(undefined);
    setExamDetail("");
    setJuzRange("");
    setNotes("");
    setSelectedSlot(undefined);
    setSelectedPenguji(undefined);
    setJuzSlots([
      { dateKey: "", period: "" },
      { dateKey: "", period: "" },
      { dateKey: "", period: "" },
      { dateKey: "", period: "" },
      { dateKey: "", period: "" },
    ]);
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
    setExamJuzPortion(undefined);
    setExamDetail("");
    setJuzRange("");
    setNotes("");
    setExamRegSlot(undefined);
    setExamRegPenguji(undefined);
    setJuzSlots([
      { dateKey: "", period: "" },
      { dateKey: "", period: "" },
      { dateKey: "", period: "" },
      { dateKey: "", period: "" },
      { dateKey: "", period: "" },
    ]);
    setIsExamRegistrationOpen(true);
  };

  const handleEditExamClick = (student: Student, exam: Exam) => {
    setSelectedStudent(student);
    setSelectedExam(exam);
    setEditExamNewSlot(undefined);
    setIsEditExamScheduleOpen(true);
  };

  const handleEditExamScheduleSubmit = async () => {
    if (!selectedStudent || !selectedExam || !editExamNewSlot || !editExamNewSlot.dateKey || !editExamNewSlot.period) {
      toast.error("Pilih jadwal baru terlebih dahulu.");
      return;
    }

    try {
      // First delete the old exam
      await deleteExam(classId, selectedStudent.id, selectedExam.id);

      // Create new exam with updated schedule
      const newExamDate = new Date(editExamNewSlot.dateKey + 'T00:00:00');
      const examData = {
        exam_date: Math.floor(newExamDate.getTime() / 1000),
        exam_date_key: editExamNewSlot.dateKey,
        status: selectedExam.status,
        score: selectedExam.score,
        juz_number: selectedExam.juz_number,
        exam_type: selectedExam.exam_type,
        notes: selectedExam.notes,
        exam_day: newExamDate.toLocaleDateString('id-ID', { weekday: 'long' }),
        exam_period: editExamNewSlot.period,
      };

      await addExamOptimized(classId, selectedStudent.id, examData);
      toast.success("Jadwal ujian berhasil diperbarui!");
      setIsEditExamScheduleOpen(false);
      setSelectedExam(null);
      setEditExamNewSlot(undefined);
    } catch (error) {
      toast.error("Gagal memperbarui jadwal ujian. Silakan coba lagi.");
    }
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
          if (!selectedSlot || !selectedSlot.dateKey || !selectedSlot.period) {
            toast.error("Jadwal ujian wajib dipilih.");
            return;
          }
        } else {
          if (!juzRange) {
            toast.error("Pilih juz untuk ujian 5 juz.");
            return;
          }
          // Validasi jadwal 5 juz
          const invalidSchedule = juzSlots.some(slot => !slot.dateKey || !slot.period);
          if (invalidSchedule) {
            toast.error("Semua jadwal ujian 5 juz harus dilengkapi.");
            return;
          }
        }

        // Tambah murid baru dengan fungsi optimized
        const newStudent = await addStudentOptimized(classId, studentName.trim());

        if (newStudent) {
          if (registrationTypeTab === 'non-5juz') {
            // Daftarkan ujian non-5 juz untuk murid baru
            const examDate = new Date(selectedSlot!.dateKey + 'T00:00:00');

            // Format juz_number berdasarkan pilihan
            // Jika 1/2 juz, tambahkan suffix "- 1/2 juz" di akhir
            const formattedJuzNumber = juzPortion === 'half'
              ? `${examDetail.trim()}${HALF_JUZ_SUFFIX}`
              : examDetail.trim();

            // Get examiner name from selected penguji
            const examiner = pengujis.find(p => p.id === selectedPenguji);

            const examData = {
              exam_date: Math.floor(examDate.getTime() / 1000),
              exam_date_key: selectedSlot!.dateKey,
              status: 'scheduled',
              exam_type: registrationTypeTab,
              score: undefined,
              juz_number: formattedJuzNumber,
              notes: notes.trim() || undefined,
              exam_day: examDate.toLocaleDateString('id-ID', { weekday: 'long' }),
              exam_period: selectedSlot!.period,
              examiner_name: examiner?.name || null,
            };

            await addExamOptimized(classId, newStudent.id, examData);
          } else {
            // Daftarkan 5 ujian untuk 5 juz
            const juzStart = parseInt(juzRange.split('-')[0]);
            for (let i = 0; i < 5; i++) {
              const examDate = new Date(juzSlots[i].dateKey + 'T00:00:00');
              const examData = {
                exam_date: Math.floor(examDate.getTime() / 1000),
                exam_date_key: juzSlots[i].dateKey,
                status: 'scheduled',
                exam_type: registrationTypeTab,
                score: undefined,
                juz_number: (juzStart + i).toString(),
                notes: notes.trim() || undefined,
                exam_day: examDate.toLocaleDateString('id-ID', { weekday: 'long' }),
                exam_period: juzSlots[i].period,
              };

              await addExamOptimized(classId, newStudent.id, examData);
            }
          }
          toast.success("Murid baru berhasil ditambahkan dengan ujian!");
        } else {
          toast.success("Murid baru berhasil ditambahkan!");
        }

        setIsAddStudentOpen(false);
        setStudentName("");
        setRegistrationTypeTab('non-5juz');
        setJuzPortion(undefined);
        setExamDetail("");
        setJuzRange("");
        setNotes("");
        setSelectedSlot(undefined);
        setSelectedPenguji(undefined);
        setJuzSlots([
          { dateKey: "", period: "" },
          { dateKey: "", period: "" },
          { dateKey: "", period: "" },
          { dateKey: "", period: "" },
          { dateKey: "", period: "" },
        ]);
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
      // Validasi form
      if (examTypeTab === 'non-5juz') {
        if (!examDetail.trim()) {
          toast.error("Detail ujian non-5 juz wajib diisi.");
          return;
        }
        if (!examRegSlot || !examRegSlot.dateKey || !examRegSlot.period) {
          toast.error("Jadwal ujian wajib dipilih.");
          return;
        }

        const examDate = new Date(examRegSlot.dateKey + 'T00:00:00');

        // Format juz_number berdasarkan pilihan
        // Jika 1/2 juz, tambahkan suffix "- 1/2 juz" di akhir
        const formattedJuzNumber = examJuzPortion === 'half'
          ? `${examDetail.trim()}${HALF_JUZ_SUFFIX}`
          : examDetail.trim();

        // Get examiner name from selected penguji
        const examiner = pengujis.find(p => p.id === examRegPenguji);

        const examData = {
          exam_date: Math.floor(examDate.getTime() / 1000),
          exam_date_key: examRegSlot.dateKey,
          status: 'scheduled',
          exam_type: examTypeTab,
          score: undefined,
          juz_number: formattedJuzNumber,
          notes: notes.trim() || undefined,
          exam_day: examDate.toLocaleDateString('id-ID', { weekday: 'long' }),
          exam_period: examRegSlot.period,
          examiner_name: examiner?.name || null,
        };

        await addExamOptimized(classId, selectedStudent.id, examData);
        toast.success("Ujian berhasil didaftarkan!");
      } else {
        if (!juzRange) {
          toast.error("Pilih juz untuk ujian 5 juz.");
          return;
        }
        // Validasi jadwal 5 juz
        const invalidSchedule = juzSlots.some(slot => !slot.dateKey || !slot.period);
        if (invalidSchedule) {
          toast.error("Semua jadwal ujian 5 juz harus dilengkapi.");
          return;
        }

        // Daftarkan 5 ujian untuk 5 juz
        const juzStart = parseInt(juzRange.split('-')[0]);
        for (let i = 0; i < 5; i++) {
          const examDate = new Date(juzSlots[i].dateKey + 'T00:00:00');
          const examData = {
            exam_date: Math.floor(examDate.getTime() / 1000),
            exam_date_key: juzSlots[i].dateKey,
            status: 'scheduled',
            exam_type: examTypeTab,
            score: undefined,
            juz_number: (juzStart + i).toString(),
            notes: notes.trim() || undefined,
            exam_day: examDate.toLocaleDateString('id-ID', { weekday: 'long' }),
            exam_period: juzSlots[i].period,
          };

          await addExamOptimized(classId, selectedStudent.id, examData);
        }
        toast.success("5 ujian berhasil didaftarkan!");
      }

      setIsExamRegistrationOpen(false);
      setSelectedStudent(null);
      setExamTypeTab('non-5juz');
      setExamJuzPortion(undefined);
      setExamDetail("");
      setJuzRange("");
      setNotes("");
      setExamRegSlot(undefined);
      setExamRegPenguji(undefined);
      setJuzSlots([
        { dateKey: "", period: "" },
        { dateKey: "", period: "" },
        { dateKey: "", period: "" },
        { dateKey: "", period: "" },
        { dateKey: "", period: "" },
      ]);
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
              onEditExam={(exam) => handleEditExamClick(student, exam)}
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
          setJuzPortion(undefined);
          setExamDetail("");
          setJuzRange("");
          setNotes("");
          setSelectedPenguji(undefined);
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
                  <div className="space-y-4">
                    {/* Dropdown Jenis Ujian */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Jenis Ujian
                      </label>
                      <select
                        value={juzPortion || ''}
                        onChange={(e) => setJuzPortion(e.target.value as JuzPortion)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Pilih jenis ujian</option>
                        {JUZ_PORTION_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        {juzPortion === 'half'
                          ? '1/2 juz: 2 murid dapat mengambil jam yang sama'
                          : juzPortion === 'full'
                          ? '1 juz: 1 murid per jam'
                          : 'Silakan pilih jenis ujian untuk melihat jadwal'}
                      </p>
                    </div>

                    <Input
                      label="Ujian"
                      value={examDetail}
                      onChange={(e) => setExamDetail(e.target.value)}
                      placeholder={juzPortion === 'half' ? 'Contoh: awal juz 5' : 'Contoh: Juz 1'}
                      required
                    />
                    <ExamSlotSelector
                      selectedSlot={selectedSlot}
                      onSlotChange={setSelectedSlot}
                      examType={registrationTypeTab}
                      classSchedule={classItem.schedule}
                      existingExams={getAllClassExams()}
                      classId={classId}
                      juzPortion={registrationTypeTab === 'non-5juz' ? juzPortion : undefined}
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
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

                    <MultiSlotSelector
                      selectedSlots={juzSlots}
                      onSlotsChange={setJuzSlots}
                      requiredCount={5}
                      examType={registrationTypeTab}
                      classSchedule={classItem.schedule}
                      existingExams={getAllClassExams()}
                                            classId={classId}
                    />
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
          setExamJuzPortion(undefined);
          setExamDetail("");
          setJuzRange("");
          setNotes("");
          setExamRegSlot(undefined);
          setExamRegPenguji(undefined);
          setJuzSlots([
            { dateKey: "", period: "" },
            { dateKey: "", period: "" },
            { dateKey: "", period: "" },
            { dateKey: "", period: "" },
            { dateKey: "", period: "" },
          ]);
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
              <div className="space-y-4">
                {/* Dropdown Jenis Ujian */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jenis Ujian
                  </label>
                  <select
                    value={examJuzPortion || ''}
                    onChange={(e) => setExamJuzPortion(e.target.value as JuzPortion)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Pilih jenis ujian</option>
                    {JUZ_PORTION_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {examJuzPortion === 'half'
                      ? '1/2 juz: 2 murid dapat mengambil jam yang sama'
                      : examJuzPortion === 'full'
                      ? '1 juz: 1 murid per jam'
                      : 'Silakan pilih jenis ujian untuk melihat jadwal'}
                  </p>
                </div>

                <Input
                  label="Ujian"
                  value={examDetail}
                  onChange={(e) => setExamDetail(e.target.value)}
                  placeholder={examJuzPortion === 'half' ? 'Contoh: awal juz 5' : 'Contoh: Juz 1'}
                  required
                />
                <ExamSlotSelector
                  selectedSlot={examRegSlot}
                  onSlotChange={setExamRegSlot}
                  examType={examTypeTab}
                  classSchedule={classItem.schedule}
                  existingExams={selectedStudent?.exams || []}
                  classId={classId}
                  juzPortion={examTypeTab === 'non-5juz' ? examJuzPortion : undefined}
                />
              </div>
            ) : (
              <div className="space-y-4">
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

                <MultiSlotSelector
                  selectedSlots={juzSlots}
                  onSlotsChange={setJuzSlots}
                  requiredCount={5}
                  examType={examTypeTab}
                  classSchedule={classItem.schedule}
                  existingExams={getAllClassExams()}
                                    classId={classId}
                />
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

      {/* Edit Exam Schedule Dialog */}
      <Dialog
        isOpen={isEditExamScheduleOpen}
        onClose={() => {
          setIsEditExamScheduleOpen(false);
          setSelectedExam(null);
          setEditExamNewSlot(undefined);
        }}
        title="Edit Jadwal Ujian"
      >
        <div className="space-y-4">
          {/* Current Exam Info */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Murid:</span>
              <span className="text-sm font-medium text-gray-900">{selectedStudent?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Ujian:</span>
              <span className="text-sm font-medium text-gray-900">
                {selectedExam?.exam_type === '5juz' ? `5 Juz (${selectedExam?.juz_number})` : `Juz ${selectedExam?.juz_number || '?'}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Jadwal Saat Ini:</span>
              <span className="text-sm font-medium text-gray-900">
                {selectedExam?.exam_date_key && selectedExam?.exam_period ? (
                  `${new Date(selectedExam.exam_date_key + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}, ${selectedExam.exam_period}`
                ) : selectedExam?.exam_day && selectedExam?.exam_period ? (
                  `${selectedExam.exam_day}, ${selectedExam.exam_period}`
                ) : '-'}
              </span>
            </div>
          </div>

          {/* New Slot Selector */}
          <ExamSlotSelector
            selectedSlot={editExamNewSlot}
            onSlotChange={setEditExamNewSlot}
            examType={selectedExam?.exam_type === '5juz' ? '5juz' : 'non-5juz'}
            classSchedule={classItem.schedule}
            existingExams={getAllClassExams().filter(e => e.id !== selectedExam?.id)}
            classId={classId}
            juzPortion={selectedExam?.exam_type === '5juz' ? undefined : (selectedExam?.juz_number?.includes('1/2') || selectedExam?.juz_number?.includes('½') ? 'half' : 'full')}
          />

          <div className="pt-4 flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsEditExamScheduleOpen(false);
                setSelectedExam(null);
                setEditExamNewSlot(undefined);
              }}
              className="flex-1"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleEditExamScheduleSubmit}
              className="flex-1"
            >
              Simpan Jadwal Baru
            </Button>
          </div>
        </div>
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
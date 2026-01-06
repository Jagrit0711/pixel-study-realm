import { useState } from 'react';
import { useExams, Exam } from '@/hooks/useExams';
import { PixelPanel } from '../game/PixelPanel';
import { PixelButton } from '../game/PixelButton';
import { PixelInput } from '../game/PixelInput';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Plus, Calendar, Clock, Trash2, Edit2, Check, X, Loader2 } from 'lucide-react';

export const ExamRoomConnected = () => {
  const { exams, loading, addExam, updateExam, deleteExam } = useExams();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newExam, setNewExam] = useState({ name: '', startDate: '' });
  const [editValues, setEditValues] = useState({ name: '', startDate: '' });
  const [saving, setSaving] = useState(false);

  const sortedExams = [...exams].sort(
    (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  );

  const getCountdown = (startDate: string) => {
    const now = new Date();
    const exam = new Date(startDate);
    const diff = exam.getTime() - now.getTime();
    
    if (diff < 0) return { days: 0, hours: 0, passed: true };
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    return { days, hours, passed: false };
  };

  const handleAddExam = async () => {
    if (!newExam.name.trim() || !newExam.startDate) return;

    setSaving(true);
    await addExam(newExam.name, newExam.startDate);
    setSaving(false);
    setShowAddModal(false);
    setNewExam({ name: '', startDate: '' });
  };

  const handleStartEdit = (exam: Exam) => {
    setEditingId(exam.id);
    setEditValues({ name: exam.name, startDate: exam.start_date });
  };

  const handleSaveEdit = async (id: string) => {
    if (!editValues.name.trim() || !editValues.startDate) return;

    setSaving(true);
    await updateExam(id, { name: editValues.name, start_date: editValues.startDate });
    setSaving(false);
    setEditingId(null);
  };

  const handleDeleteExam = async (id: string) => {
    await deleteExam(id);
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen pt-24 pb-24 px-4 flex items-center justify-center"
      >
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pt-24 pb-24 px-4"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-primary" />
            <h1 className="font-pixel text-lg text-foreground">Exam Room</h1>
          </div>
          <PixelButton size="sm" variant="accent" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Add Exam
          </PixelButton>
        </div>

        {/* Exam List */}
        {exams.length === 0 ? (
          <PixelPanel className="text-center py-12">
            <GraduationCap className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="font-pixel text-sm text-foreground mb-2">No Exams Set</h2>
            <p className="font-game text-xl text-muted-foreground mb-6">
              Add your exams to track countdown timers and optimize your study plan!
            </p>
            <PixelButton onClick={() => setShowAddModal(true)}>Add Your First Exam</PixelButton>
          </PixelPanel>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {sortedExams.map((exam, index) => {
              const countdown = getCountdown(exam.start_date);
              const isEditing = editingId === exam.id;

              return (
                <motion.div
                  key={exam.id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <PixelPanel
                    variant={countdown.passed ? 'default' : 'wood'}
                  >
                    {isEditing ? (
                      <div className="space-y-3">
                        <PixelInput
                          value={editValues.name}
                          onChange={(e) => setEditValues(p => ({ ...p, name: e.target.value }))}
                          placeholder="Exam name"
                        />
                        <PixelInput
                          type="date"
                          value={editValues.startDate}
                          onChange={(e) => setEditValues(p => ({ ...p, startDate: e.target.value }))}
                        />
                        <div className="flex gap-2">
                          <PixelButton size="sm" onClick={() => handleSaveEdit(exam.id)} disabled={saving}>
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          </PixelButton>
                          <PixelButton size="sm" variant="secondary" onClick={() => setEditingId(null)}>
                            <X className="w-4 h-4" />
                          </PixelButton>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-pixel text-sm text-foreground">{exam.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span className="font-game text-lg text-muted-foreground">
                                {new Date(exam.start_date).toLocaleDateString('en', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <PixelButton size="sm" variant="secondary" onClick={() => handleStartEdit(exam)}>
                              <Edit2 className="w-4 h-4" />
                            </PixelButton>
                            <PixelButton size="sm" variant="danger" onClick={() => handleDeleteExam(exam.id)}>
                              <Trash2 className="w-4 h-4" />
                            </PixelButton>
                          </div>
                        </div>

                        {/* Countdown */}
                        <div className="bg-card/40 p-4 pixel-border">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-5 h-5 text-game-gold" />
                            <span className="font-pixel text-[8px] text-muted-foreground">
                              {countdown.passed ? 'EXAM PASSED' : 'TIME REMAINING'}
                            </span>
                          </div>
                          {countdown.passed ? (
                            <p className="font-game text-2xl text-muted-foreground">Completed</p>
                          ) : (
                            <div className="flex items-end gap-4">
                              <div>
                                <span className="font-pixel text-2xl text-game-gold">{countdown.days}</span>
                                <span className="font-pixel text-[10px] text-muted-foreground ml-1">DAYS</span>
                              </div>
                              <div>
                                <span className="font-pixel text-2xl text-game-gold">{countdown.hours}</span>
                                <span className="font-pixel text-[10px] text-muted-foreground ml-1">HRS</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </PixelPanel>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md"
            >
              <PixelPanel variant="dialog">
                <h2 className="font-pixel text-sm text-foreground mb-4">Add Exam</h2>
                <div className="space-y-4">
                  <div>
                    <label className="font-pixel text-[8px] text-muted-foreground block mb-2">
                      EXAM NAME
                    </label>
                    <PixelInput
                      value={newExam.name}
                      onChange={(e) => setNewExam(p => ({ ...p, name: e.target.value }))}
                      placeholder="e.g., JEE Main 2024"
                    />
                  </div>

                  <div>
                    <label className="font-pixel text-[8px] text-muted-foreground block mb-2">
                      EXAM DATE
                    </label>
                    <PixelInput
                      type="date"
                      value={newExam.startDate}
                      onChange={(e) => setNewExam(p => ({ ...p, startDate: e.target.value }))}
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <PixelButton onClick={handleAddExam} className="flex-1" disabled={saving}>
                      {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Add Exam
                    </PixelButton>
                    <PixelButton
                      variant="secondary"
                      onClick={() => setShowAddModal(false)}
                    >
                      Cancel
                    </PixelButton>
                  </div>
                </div>
              </PixelPanel>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { api } from '../../services/api';
import { KeyRound, ArrowRight } from 'lucide-react';

export const StudentJoinModal = ({ isOpen, onClose }) => {
  const [quizCode, setQuizCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanCode = quizCode.trim().toUpperCase();
    if (!cleanCode) {
      setError('Please enter a 6-character Quiz Code.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.quizzes.getByCodePublic(cleanCode);
      if (res.success && res.quiz) {
        window.location.href = `/quiz/${res.quiz.quiz_code}`;
      } else {
        setError('Quiz not found. Please check the code.');
      }
    } catch (err) {
      setError(err.message || 'Invalid quiz code. Please verify and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Join Quiz as Participant"
      description="Enter the 6-character Quiz Code provided by your educator to access the test."
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <Input
          label="Quiz Passcode / Code"
          placeholder="e.g. 7XK29P"
          value={quizCode}
          onChange={(e) => setQuizCode(e.target.value.toUpperCase())}
          icon={KeyRound}
          maxLength={10}
          error={error}
          autoFocus
          className="text-center font-mono text-xl tracking-widest uppercase font-bold py-3"
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isLoading} icon={ArrowRight}>
            Join Quiz Now
          </Button>
        </div>
      </form>
    </Modal>
  );
};

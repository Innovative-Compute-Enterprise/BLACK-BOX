'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';

interface DeleteAccountProps {
  disableButton?: boolean;
}

export default function DeleteAccount({ disableButton }: DeleteAccountProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [deletionMessage, setDeletionMessage] = useState('');
  const [shouldSoftDelete, setShouldSoftDelete] = useState(false);

  const handleDelete = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/deleteUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'user_id_here', shouldSoftDelete }),
      });

      const result = await response.json();

      if (response.ok) {
        setDeletionMessage(result.message);
        router.push('/goodbye'); // Redirect user to a goodbye page if desired
      } else {
        throw new Error(result.message || 'Failed to delete account');
      }
    } catch (error: any) {
      console.error('Deletion failed:', error.message);
      setDeletionMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="my-8">
      {confirmationOpen ? (
        <form onSubmit={handleDelete}>
          <p>Are you sure you want to delete your account? This action cannot be undone.</p>
          <div>
            <label>
              <input
                type="checkbox"
                checked={shouldSoftDelete}
                onChange={(e) => setShouldSoftDelete(e.target.checked)}
              />
              Soft delete (keep data for recovery)
            </label>
          </div>
          <Button variant="flat" type="submit" loading={isSubmitting} disabled={disableButton || isSubmitting}>
            Confirm Delete
          </Button>
          <Button variant="flat" type="button" onClick={() => setConfirmationOpen(false)}>
            Cancel
          </Button>
        </form>
      ) : (
        <Button variant="slim" type="button" onClick={() => setConfirmationOpen(true)} disabled={disableButton || isSubmitting}>
          Delete Account
        </Button>
      )}
      {deletionMessage && <p>{deletionMessage}</p>}
    </div>
  );
}

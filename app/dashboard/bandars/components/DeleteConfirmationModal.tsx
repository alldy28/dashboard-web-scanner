"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  bandarName: string;
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  bandarName,
}: DeleteConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Anda Yakin?</DialogTitle>
          <DialogDescription>
            Aksi ini akan menghapus bandar dengan nama **{bandarName}** secara
            permanen. Aksi ini tidak dapat dibatalkan.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Batal
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Ya, Hapus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import type { Expense } from "@/types/expense";
import Modal from "./Modal";
import ExpenseDetailContent from "./ExpenseDetailContent";

export default function ExpenseDetailModal({
  expense,
  onClose,
  onEdit,
}: {
  expense: Expense;
  onClose: () => void;
  onEdit: () => void;
}) {
  return (
    <Modal onClose={onClose} title="Transaction details">
      <ExpenseDetailContent expense={expense} onEdit={onEdit} />
    </Modal>
  );
}

"use client";

import type { Expense } from "@/types/expense";
import { useT } from "@/lib/language-context";
import Modal from "./Modal";
import ExpenseDetailContent from "./ExpenseDetailContent";

export default function ExpenseDetailModal({
  expense,
  onClose,
  onEdit,
  onMerchantClick,
}: {
  expense: Expense;
  onClose: () => void;
  onEdit: () => void;
  onMerchantClick?: (merchant: string) => void;
}) {
  const t = useT();
  return (
    <Modal onClose={onClose} title={t("modal.transactionDetails")}>
      <ExpenseDetailContent expense={expense} onEdit={onEdit} onMerchantClick={onMerchantClick} />
    </Modal>
  );
}

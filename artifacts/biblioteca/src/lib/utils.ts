import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isPast, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "N/A";
  try {
    return format(parseISO(dateStr), "MMM d, yyyy");
  } catch (e) {
    return dateStr;
  }
}

export function isOverdue(dueDateStr: string): boolean {
  try {
    return isPast(parseISO(dueDateStr));
  } catch {
    return false;
  }
}

export function generateWhatsAppLink(phone: string | null | undefined, message: string): string {
  if (!phone) return "#";
  const cleanPhone = phone.replace(/\D/g, "");
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export function getStatusColor(type: 'book' | 'loan' | 'reservation' | 'user', status: string) {
  const colors = {
    book: {
      available: "bg-green-100 text-green-800 border-green-200",
      borrowed: "bg-orange-100 text-orange-800 border-orange-200",
      reserved: "bg-purple-100 text-purple-800 border-purple-200",
      draft: "bg-gray-100 text-gray-800 border-gray-200",
      lost: "bg-red-100 text-red-800 border-red-200",
      unavailable: "bg-gray-100 text-gray-800 border-gray-200",
    },
    loan: {
      active: "bg-blue-100 text-blue-800 border-blue-200",
      returned: "bg-green-100 text-green-800 border-green-200",
      overdue: "bg-red-100 text-red-800 border-red-200",
    },
    reservation: {
      waiting: "bg-yellow-100 text-yellow-800 border-yellow-200",
      notified: "bg-green-100 text-green-800 border-green-200",
      fulfilled: "bg-gray-100 text-gray-800 border-gray-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
    },
    user: {
      active: "bg-green-100 text-green-800 border-green-200",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      inactive: "bg-gray-100 text-gray-800 border-gray-200",
      blocked: "bg-red-100 text-red-800 border-red-200",
    }
  };
  return colors[type][status as keyof typeof colors[typeof type]] || "bg-gray-100 text-gray-800";
}

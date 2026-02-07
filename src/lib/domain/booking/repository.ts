export * from "./entity";
import { Booking } from "./entity";


export interface BookingRepository {
  getStudentBookings(studentId: string): Promise<Booking[]>;
  getBookings(teacherId: string, startDate: string, endDate: string): Promise<Booking[]>;
  getAllBookings(startDate: string, endDate: string): Promise<Booking[]>;
  createBooking(booking: Omit<Booking, "id" | "status" | "studentName" | "studentEmail" | "courseTitle">): Promise<Booking>;
  getUnpaidBookingsCount(studentId: string): Promise<number>;
  getPendingBookingsCount(teacherId: string): Promise<number>;
  getPendingBookings(teacherId: string): Promise<Booking[]>;
  updateBooking(id: string, data: Partial<Booking>): Promise<void>;
  getBookingById(id: string): Promise<Booking | null>;
}

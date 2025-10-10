import { useEffect } from 'react';
import type { Patient } from '@/types/patient';
import { actGetPatients } from '@/store/patients/act/actGetPatients';
import { clearError } from '@/store/patients/patientsSlice';
import ReservationsSkeleton from '@/components/shared/reservations-skeleton';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Eye, Edit, Trash2, MoreHorizontal } from "lucide-react";
import { useAppDispatch, useAppSelector } from '@/store/hooks';

const OwnerPatientsManagement = () => {
  const dispatch = useAppDispatch();
  const { patients, pagination, loading, error } = useAppSelector((state) => state.patients);

  useEffect(() => {
    dispatch(actGetPatients({ page: pagination.current_page }));
    return () => {
      dispatch(clearError());
    };
  }, [dispatch, pagination.current_page]);

  const handlePageChange = (page: number) => {
    dispatch(actGetPatients({ page }));
  };

  const getPageNumbers = () => {
    if (!pagination?.last_page) return [];

    const pages = [];
    const totalPages = pagination.last_page;
    const current = pagination.current_page;
    const delta = 2;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= current - delta && i <= current + delta)) {
        pages.push(i);
      } else if (i === current - delta - 1 || i === current + delta + 1) {
        pages.push("ellipsis");
      }
    }

    return pages;
  };

  if (loading === 'pending') {
    return <ReservationsSkeleton />;
  }

  return (
    <div className="container p-6 mx-auto">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Patients Management</h1>

      {error && (
        <div className="px-4 py-3 mb-4 border rounded-lg bg-destructive/10 border-destructive/50 text-destructive">
          {error.message}
        </div>
      )}

      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[280px]">User</TableHead>
              <TableHead>Date of Birth</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients.map((patient: Patient) => (
              <TableRow key={patient.id} className="group">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={patient.profile} alt={patient.name} />
                      <AvatarFallback className="text-sm font-medium bg-primary/10 text-primary">
                        {patient.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{patient.name}</span>
                      <span className="text-sm text-muted-foreground">{patient.user.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-foreground">{patient.date_of_birth}</TableCell>
                <TableCell className="text-sm text-foreground">{patient.gender}</TableCell>
                <TableCell>
                  <Badge 
                    variant={patient.user.is_active ? "confirmed" : "cancel"}
                    className={patient.user.is_active 
                      ? "bg-green-500 text-white hover:bg-green-600  px-6 rounded-nonefull" 
                      : "bg-muted text-muted-foreground hover:bg-muted/80 border-gray-500 rounded-full"
                    }
                  >
                    {patient.user.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-foreground">{patient.city}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {patient.address.length > 30 ? `${patient.address.slice(0, 30)}...` : patient.address}
                </TableCell>
                <TableCell className="text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="p-2 transition-colors rounded-full hover:bg-muted">
                      <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem className="cursor-pointer">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination controls */}
      {pagination.last_page > 1 && (
        <Pagination className="mt-6">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                className={pagination.current_page === 1 ? "pointer-events-none opacity-50" : ""}
                onClick={(e) => {
                  e.preventDefault();
                  if (pagination.current_page > 1) {
                    handlePageChange(pagination.current_page - 1);
                  }
                }}
              />
            </PaginationItem>
            {getPageNumbers().map((page, index) =>
              page === "ellipsis" ? (
                <PaginationItem key={`ellipsis-${index}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={page}>
                  <PaginationLink
                    href="#"
                    isActive={pagination.current_page === page}
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(page as number);
                    }}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              )
            )}
            <PaginationItem>
              <PaginationNext
                href="#"
                className={pagination.current_page === pagination?.last_page ? "pointer-events-none opacity-50" : ""}
                onClick={(e) => {
                  e.preventDefault();
                  if (pagination.current_page < (pagination?.last_page || 1)) {
                    handlePageChange(pagination.current_page + 1);
                  }
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default OwnerPatientsManagement;
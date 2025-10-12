import { useEffect, useState, useCallback } from 'react';
import type { Patient } from '@/types/patient';
import { actGetPatients } from '@/store/patients/act/actGetPatients';
import { clearError, setPatient } from '@/store/patients/patientsSlice';
import ReservationsSkeleton from '@/components/shared/reservations-skeleton';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Eye, Edit, Trash2, MoreHorizontal, Plus, Filter, Search, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parse } from 'date-fns';
import { Controller, useForm } from 'react-hook-form';
import { Textarea } from '@/components/ui/textarea';
import { actCreatePatient } from '@/store/patients/act/actCreatePatient';
import { actUpdatePatient } from '@/store/patients/act/actUpdatePatient';
import { actDeletePatient } from '@/store/patients/act/actDeletePatient';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import debounce from 'lodash/debounce';

// Define form data interface
interface PatientFormData {
  name: string;
  email: string;
  date_of_birth: string;
  gender: 'Female' | 'Male';
  address: string;
  city: string;
  code_postal: string;
  medical_history: string;
  allergies: string;
}

const OwnerPatientsManagement = () => {
  const dispatch = useAppDispatch();
  const { patients, pagination, loading, error } = useAppSelector((state) => state.patients);

  // State for search
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // State for Add Patient Sheet
  const { control: addControl, handleSubmit: handleAddSubmit, reset: resetAdd, setValue: setAddValue } = useForm<PatientFormData>({
    mode: "onBlur",
    defaultValues: {
      name: '',
      email: '',
      date_of_birth: '',
      gender: '' as 'Female' | 'Male',
      address: '',
      city: '',
      code_postal: '',
      medical_history: '',
      allergies: '',
    },
  });

  // State for Edit Patient Sheet
  const { control: editControl, handleSubmit: handleEditSubmit, reset: resetEdit, setValue: setEditValue } = useForm<PatientFormData>({
    mode: "onBlur",
    defaultValues: {
      name: '',
      email: '',
      date_of_birth: '',
      gender: '' as 'Female' | 'Male',
      address: '',
      city: '',
      code_postal: '',
      medical_history: '',
      allergies: '',
    },
  });

  // State for date pickers and other UI
  const [addDate, setAddDate] = useState<Date | undefined>(undefined);
  const [editDate, setEditDate] = useState<Date | undefined>(undefined);
  const [addMonth, setAddMonth] = useState<Date>(new Date());
  const [editMonth, setEditMonth] = useState<Date>(new Date());
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [isAddSubmitting, setIsAddSubmitting] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isViewSheetOpen, setIsViewSheetOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);

  // Utility functions
  const isValidDate = (date: Date): boolean => {
    return date instanceof Date && !isNaN(date.getTime());
  };

  const formatDateForDisplay = (date: Date | undefined): string => {
    if (!date) return '';
    return format(date, 'MMMM dd, yyyy');
  };

  const formatDateForAPI = (date: Date | undefined): string => {
    if (!date) return '';
    return format(date, 'yyyy-MM-dd');
  };

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      dispatch(actGetPatients({ 
        page: 1, // Reset to first page on search
        search: value.trim() || undefined 
      }));
    }, 500),
    [dispatch]
  );

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    dispatch(actGetPatients({ page: 1 })); // Reset to first page without search
  };

  // Fetch patients when page changes or on mount
  useEffect(() => {
    dispatch(actGetPatients({ page: pagination.current_page, search: searchTerm || undefined }));
    return () => {
      dispatch(clearError());
    };
  }, [dispatch, pagination.current_page,searchTerm]);

  useEffect(() => {
    if (selectedPatient && isEditSheetOpen) {
      // Populate edit form
      setEditValue('name', selectedPatient.name ?? '');
      setEditValue('email', selectedPatient.user.email ?? '');
      setEditValue('address', selectedPatient.address ?? '');
      setEditValue('city', selectedPatient.city ?? '');
      setEditValue('code_postal', selectedPatient.code_postal ?? '');
      setEditValue('medical_history', selectedPatient.medical_history ?? '');
      setEditValue('allergies', selectedPatient.allergies ?? '');
      setEditValue('gender', selectedPatient.gender ?? 'Male');
      const parsedDate = parse(selectedPatient.date_of_birth ?? '', 'yyyy-MM-dd', new Date());
      if (isValidDate(parsedDate)) {
        setEditDate(parsedDate);
        setEditMonth(parsedDate);
        setEditValue('date_of_birth', formatDateForDisplay(parsedDate));
      }
    }
  }, [selectedPatient, isEditSheetOpen, setEditValue]);

  const handlePageChange = (page: number) => {
    dispatch(actGetPatients({ page, search: searchTerm || undefined }));
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

  const onAddSubmit = async (data: PatientFormData) => {
    setIsAddSubmitting(true);
    try {
      const patientData = {
        ...data,
        date_of_birth: formatDateForAPI(addDate),
      };
      const response = await dispatch(actCreatePatient(patientData)).unwrap();
      dispatch(setPatient(response.data));
      toast.success("Patient added successfully", {
        onAutoClose: () => {
          resetAdd();
          setAddDate(undefined);
        },
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to add patient";
      toast.error(errorMessage);
    } finally {
      setIsAddSubmitting(false);
    }
  };

  const onEditSubmit = async (data: PatientFormData) => {
    if (!selectedPatient) return;
    setIsEditSubmitting(true);
    try {
      const patientData = {
        ...data,
        date_of_birth: formatDateForAPI(editDate),
      };
      const response = await dispatch(actUpdatePatient({ id: selectedPatient.id, ...patientData })).unwrap();
      dispatch(setPatient(response.data));
      toast.success("Patient updated successfully");
      setIsEditSheetOpen(false);
      resetEdit();
      setEditDate(undefined);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update patient";
      toast.error(errorMessage);
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!patientToDelete) return;
    setIsDeleteSubmitting(true);
    try {
      await dispatch(actDeletePatient(patientToDelete.id)).unwrap();
      toast.success("Patient deleted successfully");
      dispatch(actGetPatients({ page: pagination.current_page, search: searchTerm || undefined }));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete patient";
      toast.error(errorMessage);
    } finally {
      setIsDeleteSubmitting(false);
      setIsDeleteDialogOpen(false);
      setPatientToDelete(null);
    }
  };

  const openEditSheet = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsEditSheetOpen(true);
  };

  const openViewSheet = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsViewSheetOpen(true);
  };

  const openDeleteDialog = (patient: Patient) => {
    setPatientToDelete(patient);
    setIsDeleteDialogOpen(true);
  };

  if (loading === 'pending') {
    return <ReservationsSkeleton />;
  }

  return (
    <div className="container p-6 mx-auto">
      <div className="flex justify-between mb-8">
        <div>
          <h1 className="mb-1 text-3xl font-semibold text-foreground">Patients Management</h1>
          <p className="text-sm text-muted-foreground">
            Stay updated with your latest activities and messages
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button className="gap-2 text-white bg-blue-600 hover:bg-blue-800">
                <Plus className="w-4 h-4" />
                Add Patient
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md">
              <SheetHeader>
                <SheetTitle>Add New Patient</SheetTitle>
                <SheetDescription>
                  Fill in the details below to add a new patient to the system.
                </SheetDescription>
              </SheetHeader>
              <form onSubmit={handleAddSubmit(onAddSubmit)} className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <Label htmlFor="add-name">Name</Label>
                    <Controller
                      name="name"
                      control={addControl}
                      rules={{ required: "Name is required" }}
                      render={({ field, fieldState }) => (
                        <div>
                          <Input
                            id="add-name"
                            placeholder="Enter full name"
                            {...field}
                          />
                          {fieldState.error && (
                            <p className="mt-1 text-xs text-red-500">{fieldState.error.message}</p>
                          )}
                        </div>
                      )}
                    />
                  </div>
                  <div className="relative">
                    <Label htmlFor="add-email">Email</Label>
                    <Controller
                      name="email"
                      control={addControl}
                      rules={{ required: "Email is required", pattern: { value: /^\S+@\S+$/i, message: "Invalid email" } }}
                      render={({ field, fieldState }) => (
                        <div>
                          <Input
                            id="add-email"
                            type="email"
                            placeholder="Enter email"
                            {...field}
                          />
                          {fieldState.error && (
                            <p className="mt-1 text-xs text-red-500">{fieldState.error.message}</p>
                          )}
                        </div>
                      )}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <Label htmlFor="add-date">Date of Birth</Label>
                    <div className="relative flex gap-2">
                      <Controller
                        name="date_of_birth"
                        control={addControl}
                        rules={{ required: "Date of birth is required" }}
                        render={({ field, fieldState }) => (
                          <div className="w-full">
                            <Input
                              id="add-date"
                              value={formatDateForDisplay(addDate)}
                              placeholder="June 01, 2025"
                              className="pr-10 bg-background"
                              onChange={(e) => {
                                const input = e.target.value;
                                field.onChange(input);
                                const parsedDate = new Date(input);
                                if (isValidDate(parsedDate)) {
                                  setAddDate(parsedDate);
                                  setAddMonth(parsedDate);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "ArrowDown") {
                                  e.preventDefault();
                                  setAddOpen(true);
                                }
                              }}
                            />
                            {fieldState.error && (
                              <p className="mt-1 text-xs text-red-500">{fieldState.error.message}</p>
                            )}
                          </div>
                        )}
                      />
                      <Popover open={addOpen} onOpenChange={setAddOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            id="add-date-picker"
                            variant="ghost"
                            className="absolute -translate-y-1/2 top-1/2 right-2 size-6"
                          >
                            <CalendarIcon className="size-3.5" />
                            <span className="sr-only">Select date</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-auto p-0 overflow-hidden"
                          align="end"
                          alignOffset={-8}
                          sideOffset={10}
                        >
                          <Calendar
                            mode="single"
                            selected={addDate}
                            captionLayout="dropdown"
                            month={addMonth}
                            onMonthChange={setAddMonth}
                            onSelect={(selectedDate) => {
                              setAddDate(selectedDate);
                              setAddValue('date_of_birth', formatDateForDisplay(selectedDate));
                              setAddOpen(false);
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <div className="relative">
                    <Label htmlFor="add-gender">Gender</Label>
                    <Controller
                      name="gender"
                      control={addControl}
                      rules={{ required: "Gender is required" }}
                      render={({ field, fieldState }) => (
                        <div>
                          <Select onValueChange={(value: 'Female' | 'Male') => field.onChange(value)} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                            </SelectContent>
                          </Select>
                          {fieldState.error && (
                            <p className="mt-1 text-xs text-red-500">{fieldState.error.message}</p>
                          )}
                        </div>
                      )}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <Label htmlFor="add-city">City</Label>
                    <Controller
                      name="city"
                      control={addControl}
                      render={({ field }) => (
                        <Input
                          id="add-city"
                          placeholder="Enter city"
                          {...field}
                        />
                      )}
                    />
                  </div>
                  <div className="relative">
                    <Label htmlFor="add-code_postal">Postal Code</Label>
                    <Controller
                      name="code_postal"
                      control={addControl}
                      render={({ field }) => (
                        <Input
                          id="add-code_postal"
                          placeholder="Enter postal code"
                          {...field}
                        />
                      )}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="add-address">Address</Label>
                  <Controller
                    name="address"
                    control={addControl}
                    render={({ field }) => (
                      <Input
                        id="add-address"
                        placeholder="Enter address"
                        {...field}
                      />
                    )}
                  />
                </div>
                <div>
                  <Label htmlFor="add-medical_history">
                    Medical History <span className="text-red-500">*</span> (<p className="inline text-xs text-gray-500">if you don't have history, write "no"</p>)
                  </Label>
                  <Controller
                    name="medical_history"
                    control={addControl}
                    rules={{ required: "Medical history is required" }}
                    render={({ field, fieldState }) => (
                      <div>
                        <Textarea
                          id="add-medical_history"
                          placeholder="Type your message here."
                          className="mt-1"
                          {...field}
                        />
                        {fieldState.error && (
                          <p className="mt-1 text-xs text-red-500">{fieldState.error.message}</p>
                        )}
                      </div>
                    )}
                  />
                </div>
                <div>
                  <Label htmlFor="add-allergies">
                    Allergies <span className="text-red-500">*</span> (<p className="inline text-xs text-gray-500">if you don't have any allergies, write "no"</p>)
                  </Label>
                  <Controller
                    name="allergies"
                    control={addControl}
                    rules={{ required: "Allergies information is required" }}
                    render={({ field, fieldState }) => (
                      <div>
                        <Textarea
                          id="add-allergies"
                          placeholder="List any known allergies, medications, food, environmental, etc."
                          className="mt-1"
                          {...field}
                        />
                        {fieldState.error && (
                          <p className="mt-1 text-xs text-red-500">{fieldState.error.message}</p>
                        )}
                      </div>
                    )}
                  />
                </div>
                <SheetFooter>
                  <Button type="button" variant="outline" onClick={() => resetAdd()}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="text-white bg-blue-600 hover:bg-blue-800"
                    disabled={isAddSubmitting}
                  >
                    {isAddSubmitting ? (
                      <span className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 11-16 0z"></path>
                        </svg>
                        Adding...
                      </span>
                    ) : (
                      "Add Patient"
                    )}
                  </Button>
                </SheetFooter>
              </form>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      {/* Search and Filters */}
      <div className="flex justify-end gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute w-4 h-4 -translate-y-1/2 left-3 top-1/2 text-muted-foreground" />
          <Input
            placeholder="Search patients by name or email..."
            className="bg-white pl-9 pr-9"
            value={searchTerm}
            onChange={handleSearchChange}
          />
          {searchTerm && (
            <Button
              variant="ghost"
              className="absolute -translate-y-1/2 top-1/2 right-2 size-6"
              onClick={clearSearch}
            >
              <X className="size-4 text-muted-foreground" />
              <span className="sr-only">Clear search</span>
            </Button>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 bg-transparent">
              <Filter className="w-4 h-4" />
              Filter by Type
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              All Notifications
            </DropdownMenuItem>
            <DropdownMenuItem>
              Appointment Confirmations
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 bg-transparent">
              Filter by Status
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              All
            </DropdownMenuItem>
            <DropdownMenuItem>
              Active
            </DropdownMenuItem>
            <DropdownMenuItem>
              Inactive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
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
            {patients.length === 0 && searchTerm && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No patients found for "{searchTerm}".
                </TableCell>
              </TableRow>
            )}
            {patients.map((patient: Patient) => (
              <TableRow key={patient.id} className="group">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={patient.profile ?? ''} alt={patient.name ?? ''} />
                      <AvatarFallback className="text-sm font-medium bg-primary/10 text-primary">
                        {patient.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? ''}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{patient.name ?? 'Unknown'}</span>
                      <span className="text-sm text-muted-foreground">{patient.user.email ?? 'No email'}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-foreground">{patient.date_of_birth ?? 'N/A'}</TableCell>
                <TableCell className="text-sm text-foreground">{patient.gender ?? 'N/A'}</TableCell>
                <TableCell>
                  <span
                    className={patient.user.is_active
                      ? "bg-green-500 text-white hover:bg-green-600 px-6 rounded-full py-1"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 border-gray-500 rounded-full py-1"
                    }
                  >
                    {patient.user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-foreground">{patient.city ?? 'N/A'}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {patient.address?.length > 30 ? `${patient.address.slice(0, 30)}...` : patient.address ?? 'N/A'}
                </TableCell>
                <TableCell className="text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="p-2 transition-colors rounded-full hover:bg-muted">
                      <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem className="cursor-pointer" onClick={() => openViewSheet(patient)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer" onClick={() => openEditSheet(patient)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer text-destructive focus:text-destructive"
                        onClick={() => openDeleteDialog(patient)}
                      >
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
      {/* Edit Patient Sheet */}
      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Edit Patient</SheetTitle>
            <SheetDescription>
              Update the patient details below.
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleEditSubmit(onEditSubmit)} className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <Label htmlFor="edit-name">Name</Label>
                <Controller
                  name="name"
                  control={editControl}
                  rules={{ required: "Name is required" }}
                  render={({ field, fieldState }) => (
                    <div>
                      <Input
                        id="edit-name"
                        placeholder="Enter full name"
                        {...field}
                      />
                      {fieldState.error && (
                        <p className="mt-1 text-xs text-red-500">{fieldState.error.message}</p>
                      )}
                    </div>
                  )}
                />
              </div>
              <div className="relative">
                <Label htmlFor="edit-email">Email</Label>
                <Controller
                  name="email"
                  control={editControl}
                  rules={{ required: "Email is required", pattern: { value: /^\S+@\S+$/i, message: "Invalid email" } }}
                  render={({ field, fieldState }) => (
                    <div>
                      <Input
                        id="edit-email"
                        type="email"
                        placeholder="Enter email"
                        {...field}
                      />
                      {fieldState.error && (
                        <p className="mt-1 text-xs text-red-500">{fieldState.error.message}</p>
                      )}
                    </div>
                  )}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <Label htmlFor="edit-date">Date of Birth</Label>
                <div className="relative flex gap-2">
                  <Controller
                    name="date_of_birth"
                    control={editControl}
                    rules={{ required: "Date of birth is required" }}
                    render={({ field, fieldState }) => (
                      <div className="w-full">
                        <Input
                          id="edit-date"
                          value={formatDateForDisplay(editDate)}
                          placeholder="June 01, 2025"
                          className="pr-10 bg-background"
                          onChange={(e) => {
                            const input = e.target.value;
                            field.onChange(input);
                            const parsedDate = new Date(input);
                            if (isValidDate(parsedDate)) {
                              setEditDate(parsedDate);
                              setEditMonth(parsedDate);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "ArrowDown") {
                              e.preventDefault();
                              setEditOpen(true);
                            }
                          }}
                        />
                        {fieldState.error && (
                          <p className="mt-1 text-xs text-red-500">{fieldState.error.message}</p>
                        )}
                      </div>
                    )}
                  />
                  <Popover open={editOpen} onOpenChange={setEditOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        id="edit-date-picker"
                        variant="ghost"
                        className="absolute -translate-y-1/2 top-1/2 right-2 size-6"
                      >
                        <CalendarIcon className="size-3.5" />
                        <span className="sr-only">Select date</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0 overflow-hidden"
                      align="end"
                      alignOffset={-8}
                      sideOffset={10}
                    >
                      <Calendar
                        mode="single"
                        selected={editDate}
                        captionLayout="dropdown"
                        month={editMonth}
                        onMonthChange={setEditMonth}
                        onSelect={(selectedDate) => {
                          setEditDate(selectedDate);
                          setEditValue('date_of_birth', formatDateForDisplay(selectedDate));
                          setEditOpen(false);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="relative">
                <Label htmlFor="edit-gender">Gender</Label>
                <Controller
                  name="gender"
                  control={editControl}
                  rules={{ required: "Gender is required" }}
                  render={({ field, fieldState }) => (
                    <div>
                      <Select onValueChange={(value: 'Female' | 'Male') => field.onChange(value)} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                      {fieldState.error && (
                        <p className="mt-1 text-xs text-red-500">{fieldState.error.message}</p>
                      )}
                    </div>
                  )}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <Label htmlFor="edit-city">City</Label>
                <Controller
                  name="city"
                  control={editControl}
                  render={({ field }) => (
                    <Input
                      id="edit-city"
                      placeholder="Enter city"
                      {...field}
                    />
                  )}
                />
              </div>
              <div className="relative">
                <Label htmlFor="edit-code_postal">Postal Code</Label>
                <Controller
                  name="code_postal"
                  control={editControl}
                  render={({ field }) => (
                    <Input
                      id="edit-code_postal"
                      placeholder="Enter postal code"
                      {...field}
                    />
                  )}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-address">Address</Label>
              <Controller
                name="address"
                control={editControl}
                render={({ field }) => (
                  <Input
                    id="edit-address"
                    placeholder="Enter address"
                    {...field}
                  />
                )}
              />
            </div>
            <div>
              <Label htmlFor="edit-medical_history">
                Medical History <span className="text-red-500">*</span> (<p className="inline text-xs text-gray-500">if you don't have history, write "no"</p>)
              </Label>
              <Controller
                name="medical_history"
                control={editControl}
                rules={{ required: "Medical history is required" }}
                render={({ field, fieldState }) => (
                  <div>
                    <Textarea
                      id="edit-medical_history"
                      placeholder="Type your message here."
                      className="mt-1"
                      {...field}
                    />
                    {fieldState.error && (
                      <p className="mt-1 text-xs text-red-500">{fieldState.error.message}</p>
                    )}
                  </div>
                )}
              />
            </div>
            <div>
              <Label htmlFor="edit-allergies">
                Allergies <span className="text-red-500">*</span> (<p className="inline text-xs text-gray-500">if you don't have any allergies, write "no"</p>)
              </Label>
              <Controller
                name="allergies"
                control={editControl}
                rules={{ required: "Allergies information is required" }}
                render={({ field, fieldState }) => (
                  <div>
                    <Textarea
                      id="edit-allergies"
                      placeholder="List any known allergies, medications, food, environmental, etc."
                      className="mt-1"
                      {...field}
                    />
                    {fieldState.error && (
                      <p className="mt-1 text-xs text-red-500">{fieldState.error.message}</p>
                    )}
                  </div>
                )}
              />
            </div>
            <SheetFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditSheetOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="text-white bg-blue-600 hover:bg-blue-800"
                disabled={isEditSubmitting}
              >
                {isEditSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 11-16 0z"></path>
                    </svg>
                    Updating...
                  </span>
                ) : (
                  "Update Patient"
                )}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
      {/* View Patient Sheet */}
      <Sheet open={isViewSheetOpen} onOpenChange={setIsViewSheetOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Patient Details</SheetTitle>
            <SheetDescription>
              View the details of the patient below.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {selectedPatient && (
              <>
                <div>
                  <Label>Name</Label>
                  <p className="text-sm text-foreground">{selectedPatient.name ?? 'Unknown'}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="text-sm text-foreground">{selectedPatient.user.email ?? 'No email'}</p>
                </div>
                <div>
                  <Label>Date of Birth</Label>
                  <p className="text-sm text-foreground">{selectedPatient.date_of_birth ?? 'N/A'}</p>
                </div>
                <div>
                  <Label>Gender</Label>
                  <p className="text-sm text-foreground">{selectedPatient.gender ?? 'N/A'}</p>
                </div>
                <div>
                  <Label>City</Label>
                  <p className="text-sm text-foreground">{selectedPatient.city ?? 'N/A'}</p>
                </div>
                <div>
                  <Label>Postal Code</Label>
                  <p className="text-sm text-foreground">{selectedPatient.code_postal ?? 'N/A'}</p>
                </div>
                <div>
                  <Label>Address</Label>
                  <p className="text-sm text-foreground">{selectedPatient.address ?? 'N/A'}</p>
                </div>
                <div>
                  <Label>Medical History</Label>
                  <p className="text-sm text-foreground">{selectedPatient.medical_history ?? 'No history'}</p>
                </div>
                <div>
                  <Label>Allergies</Label>
                  <p className="text-sm text-foreground">{selectedPatient.allergies ?? 'No allergies'}</p>
                </div>
              </>
            )}
            <SheetFooter>
              <Button variant="outline" onClick={() => setIsViewSheetOpen(false)}>
                Close
              </Button>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the patient {patientToDelete?.name ?? 'Unknown'}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleteSubmitting}
            >
              {isDeleteSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 11-16 0z"></path>
                  </svg>
                  Deleting...
                </span>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
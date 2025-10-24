import { useEffect, useState, useCallback } from 'react';
import { actGetStaff } from '@/store/staff/act/actGetStaff';
import { actUpdateStaff } from '@/store/staff/act/actUpdateStaff';
import { actDeleteStaff } from '@/store/staff/act/actDeleteStaff';
import { clearError, setStaff } from '@/store/staff/staffSlice';
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
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Controller, useForm } from 'react-hook-form';
import { Textarea } from '@/components/ui/textarea';
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
import { normalizeWorkingDays, type Staff, type StaffFormData, type StaffEditFormData } from '@/types/staff';
import { actCreateStaff } from '@/store/staff/act/actAddStaff';

// Placeholder specialties (replace with actual API data)
const SPECIALITIES = [
  { id: 8, name: 'Dentistry' },
  { id: 9, name: 'General Medicine' },
  { id: 10, name: 'Pediatrics' },
];

const OwnerStaffList = () => {
  const dispatch = useAppDispatch();
  const { staff, pagination, loading, error } = useAppSelector((state) => state.staff);

  // State for search
  const [searchTerm, setSearchTerm] = useState<string>('');

  // State for selected staff
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

  // State for Add Staff Sheet
  const { control: addControl, handleSubmit: handleAddSubmit, reset: resetAdd } = useForm<StaffFormData>({
    mode: "onBlur",
    defaultValues: {
      email: '',
      password: '',
      password_confirmation: '',
      name: '',
      speciality_id: 8,
      license_number: '',
      bio: '',
      consultation_fees: 0,
      start_time: '09:00',
      end_time: '18:00',
      available_days: [],
      profile_image: '',
    },
  });

  // State for Edit Staff Sheet
  const { control: editControl, handleSubmit: handleEditSubmit, reset: resetEdit, setValue: setEditValue } = useForm<StaffEditFormData>({
    mode: "onBlur",
    defaultValues: {
      email: '',
      name: '',
      speciality_id: 8,
      license_number: '',
      bio: '',
      consultation_fees: 0,
      start_time: '09:00',
      end_time: '18:00',
      available_days: [],
      profile_image: '',
    },
  });

  // State for UI
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isViewSheetOpen, setIsViewSheetOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<Staff | null>(null);
  const [isAddSubmitting, setIsAddSubmitting] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);

  // Available days options
  const DAYS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      dispatch(actGetStaff({ 
        page: 1,
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
    dispatch(actGetStaff({ page: 1 }));
  };

  // Fetch staff when page changes or on mount
  useEffect(() => {
    dispatch(actGetStaff({ page: pagination.current_page, search: searchTerm || undefined }));
    return () => {
      dispatch(clearError());
    };
  }, [dispatch, pagination.current_page, searchTerm]);

  // Populate edit form when selectedStaff changes
  useEffect(() => {
    if (selectedStaff && isEditSheetOpen) {
      setEditValue('email', selectedStaff.user.email ?? '');
      setEditValue('name', selectedStaff.name ?? '');
      setEditValue('speciality_id', selectedStaff.speciality_id ?? 8);
      setEditValue('license_number', selectedStaff.license_number ?? '');
      setEditValue('bio', selectedStaff.bio ?? '');
      setEditValue('consultation_fees', selectedStaff.consultation_fees ?? 0);
      setEditValue('start_time', selectedStaff.start_time ?? '09:00');
      setEditValue('end_time', selectedStaff.end_time ?? '18:00');
      setEditValue('available_days', normalizeWorkingDays(selectedStaff.working_days) ?? []);
      setEditValue('profile_image', selectedStaff.user.profile_image ?? '');
    }
  }, [selectedStaff, isEditSheetOpen, setEditValue]);

  const handlePageChange = (page: number) => {
    dispatch(actGetStaff({ page, search: searchTerm || undefined }));
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

  const onAddSubmit = async (data: StaffFormData) => {
    setIsAddSubmitting(true);
    try {
      const cabinetId = 1; // Replace with actual logic to get cabinetId
      const response = await dispatch(actCreateStaff({ cabinetId, data })).unwrap();
      dispatch(setStaff(response.data));
      toast.success("Staff member added successfully", {
        onAutoClose: () => {
          resetAdd();
          setIsAddSheetOpen(false);
        },
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to add staff member";
      toast.error(errorMessage);
    } finally {
      setIsAddSubmitting(false);
    }
  };

  const onEditSubmit = async (data: StaffEditFormData) => {
    if (!selectedStaff) return;
    setIsEditSubmitting(true);
    try {
      const response = await dispatch(actUpdateStaff({ id: selectedStaff.id, data })).unwrap();
      dispatch(setStaff(response.data));
      toast.success("Staff member updated successfully");
      setIsEditSheetOpen(false);
      resetEdit();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update staff member";
      toast.error(errorMessage);
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!staffToDelete) return;
    setIsDeleteSubmitting(true);
    try {
      await dispatch(actDeleteStaff(staffToDelete.id)).unwrap();
      toast.success("Staff member deleted successfully");
      dispatch(actGetStaff({ page: pagination.current_page, search: searchTerm || undefined }));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete staff member";
      toast.error(errorMessage);
    } finally {
      setIsDeleteSubmitting(false);
      setIsDeleteDialogOpen(false);
      setStaffToDelete(null);
    }
  };

  const openEditSheet = (staff: Staff) => {
    setSelectedStaff(staff);
    setIsEditSheetOpen(true);
  };

  const openViewSheet = (staff: Staff) => {
    setSelectedStaff(staff);
    setIsViewSheetOpen(true);
  };

  const openDeleteDialog = (staff: Staff) => {
    setStaffToDelete(staff);
    setIsDeleteDialogOpen(true);
  };

  if (loading === 'pending') {
    return <ReservationsSkeleton />;
  }

  // Debug the error object to understand its structure
  if (error) {
    console.error("Error object:", error);
  }

  // Safely extract error message
  const getErrorMessage = (err: unknown): string => {
    if (err instanceof Error) {
      return err.message;
    }
    if (typeof err === 'object' && err !== null && 'message' in err) {
      return String((err as { message: unknown }).message);
    }
    return 'An unknown error occurred';
  };

  return (
    <div className="container p-6 mx-auto">
      <div className="flex justify-between mb-8">
        <div>
          <h1 className="mb-1 text-3xl font-semibold text-foreground">Staff Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage your clinic's staff members and their details
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Sheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
            <SheetTrigger asChild>
              <Button className="gap-2 text-white bg-blue-600 hover:bg-blue-800">
                <Plus className="w-4 h-4" />
                Add Staff
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md">
              <SheetHeader>
                <SheetTitle>Add New Staff</SheetTitle>
                <SheetDescription>
                  Fill in the details below to add a new staff member to the system.
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
                    <Label htmlFor="add-password">Password</Label>
                    <Controller
                      name="password"
                      control={addControl}
                      rules={{ required: "Password is required", minLength: { value: 8, message: "Password must be at least 8 characters" } }}
                      render={({ field, fieldState }) => (
                        <div>
                          <Input
                            id="add-password"
                            type="password"
                            placeholder="Enter password"
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
                    <Label htmlFor="add-password_confirmation">Confirm Password</Label>
                    <Controller
                      name="password_confirmation"
                      control={addControl}
                      rules={{
                        required: "Password confirmation is required",
                        validate: (value, formValues) => value === formValues.password || "Passwords do not match",
                      }}
                      render={({ field, fieldState }) => (
                        <div>
                          <Input
                            id="add-password_confirmation"
                            type="password"
                            placeholder="Confirm password"
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
                <div className="relative">
                  <Label htmlFor="add-speciality_id">Speciality</Label>
                  <Controller
                    name="speciality_id"
                    control={addControl}
                    rules={{ required: "Speciality is required" }}
                    render={({ field, fieldState }) => (
                      <div>
                        <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value.toString()}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select speciality" />
                          </SelectTrigger>
                          <SelectContent>
                            {SPECIALITIES.map((speciality) => (
                              <SelectItem key={speciality.id} value={speciality.id.toString()}>
                                {speciality.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {fieldState.error && (
                          <p className="mt-1 text-xs text-red-500">{fieldState.error.message}</p>
                        )}
                      </div>
                    )}
                  />
                </div>
                <div className="relative">
                  <Label htmlFor="add-license_number">License Number</Label>
                  <Controller
                    name="license_number"
                    control={addControl}
                    rules={{ required: "License number is required" }}
                    render={({ field, fieldState }) => (
                      <div>
                        <Input
                          id="add-license_number"
                          placeholder="Enter license number"
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
                  <Label htmlFor="add-bio">Bio</Label>
                  <Controller
                    name="bio"
                    control={addControl}
                    render={({ field }) => (
                      <Textarea
                        id="add-bio"
                        placeholder="Enter bio"
                        className="mt-1"
                        {...field}
                      />
                    )}
                  />
                </div>
                <div className="relative">
                  <Label htmlFor="add-consultation_fees">Consultation Fees</Label>
                  <Controller
                    name="consultation_fees"
                    control={addControl}
                    rules={{ required: "Consultation fees are required", min: { value: 0, message: "Fees cannot be negative" } }}
                    render={({ field, fieldState }) => (
                      <div>
                        <Input
                          id="add-consultation_fees"
                          type="number"
                          placeholder="Enter consultation fees"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                        {fieldState.error && (
                          <p className="mt-1 text-xs text-red-500">{fieldState.error.message}</p>
                        )}
                      </div>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <Label htmlFor="add-start_time">Start Time</Label>
                    <Controller
                      name="start_time"
                      control={addControl}
                      rules={{ required: "Start time is required" }}
                      render={({ field, fieldState }) => (
                        <div>
                          <Input
                            id="add-start_time"
                            type="time"
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
                    <Label htmlFor="add-end_time">End Time</Label>
                    <Controller
                      name="end_time"
                      control={addControl}
                      rules={{ required: "End time is required" }}
                      render={({ field, fieldState }) => (
                        <div>
                          <Input
                            id="add-end_time"
                            type="time"
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
                <div className="relative">
                  <Label htmlFor="add-available_days">Available Days</Label>
                  <Controller
                    name="available_days"
                    control={addControl}
                    rules={{ required: "Available days are required", validate: (value) => value.length > 0 || "At least one day must be selected" }}
                    render={({ field, fieldState }) => (
                      <div>
                        <Select
                          onValueChange={(value) => {
                            const currentDays = field.value || [];
                            if (currentDays.includes(value)) {
                              field.onChange(currentDays.filter((day: string) => day !== value));
                            } else {
                              field.onChange([...currentDays, value]);
                            }
                          }}
                          value=""
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select available days" />
                          </SelectTrigger>
                          <SelectContent>
                            {DAYS.map((day) => (
                              <SelectItem key={day} value={day}>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={field.value.includes(day)}
                                    readOnly
                                  />
                                  {day.charAt(0).toUpperCase() + day.slice(1)}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {field.value.map((day: string) => (
                            <span key={day} className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                              {day.charAt(0).toUpperCase() + day.slice(1)}
                              <button
                                type="button"
                                className="ml-1 text-blue-600 hover:text-blue-800"
                                onClick={() => field.onChange(field.value.filter((d: string) => d !== day))}
                              >
                                &times;
                              </button>
                            </span>
                          ))}
                        </div>
                        {fieldState.error && (
                          <p className="mt-1 text-xs text-red-500">{fieldState.error.message}</p>
                        )}
                      </div>
                    )}
                  />
                </div>
                <div className="relative">
                  <Label htmlFor="add-profile_image">Profile Image URL</Label>
                  <Controller
                    name="profile_image"
                    control={addControl}
                    render={({ field }) => (
                      <Input
                        id="add-profile_image"
                        placeholder="Enter profile image URL"
                        {...field}
                      />
                    )}
                  />
                </div>
                <SheetFooter>
                  <Button type="button" variant="outline" onClick={() => { resetAdd(); setIsAddSheetOpen(false); }}>
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
                      "Add Staff"
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
            placeholder="Search staff by name or email..."
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
              Filter by Job Title
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => dispatch(actGetStaff({ page: 1, job_title: undefined }))}>
              All Job Titles
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
            <DropdownMenuItem onClick={() => dispatch(actGetStaff({ page: 1, is_active: undefined }))}>
              All
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => dispatch(actGetStaff({ page: 1, is_active: true }))}>
              Active
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => dispatch(actGetStaff({ page: 1, is_active: false }))}>
              Inactive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {error && (
        <div className="px-4 py-3 mb-4 border rounded-lg bg-destructive/10 border-destructive/50 text-destructive">
          {getErrorMessage(error)}
        </div>
      )}
      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[280px]">Staff</TableHead>
              <TableHead>Job Title</TableHead>
              <TableHead>Working Days</TableHead>
              <TableHead>Working Hours</TableHead>
              <TableHead>Cabinet</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.length === 0 && searchTerm && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No staff found for "{searchTerm}".
                </TableCell>
              </TableRow>
            )}
            {staff.map((staffMember: Staff) => (
              <TableRow key={staffMember.id} className="group">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={staffMember.user.profile_image ?? ''} alt={staffMember.name ?? ''} />
                      <AvatarFallback className="text-sm font-medium bg-primary/10 text-primary">
                        {staffMember.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? ''}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{staffMember.name ?? 'Unknown'}</span>
                      <span className="text-sm text-muted-foreground">{staffMember.user.email ?? 'No email'}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-foreground">{staffMember.job_title ?? 'N/A'}</TableCell>
                <TableCell className="text-sm text-foreground">
                  {normalizeWorkingDays(staffMember.working_days)?.map(day => day.charAt(0).toUpperCase() + day.slice(1)).join(', ') || 'N/A'}
                </TableCell>
                <TableCell className="text-sm text-foreground">
                  {staffMember.start_time && staffMember.end_time 
                    ? `${staffMember.start_time.slice(0, 5)} - ${staffMember.end_time.slice(0, 5)}`
                    : 'N/A'}
                </TableCell>
                <TableCell className="text-sm text-foreground">{staffMember.cabinet?.name ?? 'N/A'}</TableCell>
                <TableCell>
                  <span
                    className={staffMember.is_active
                      ? "bg-green-500 text-white hover:bg-green-600 px-6 rounded-full py-1"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 border-gray-500 rounded-full py-1"
                    }
                  >
                    {staffMember.is_active ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="p-2 transition-colors rounded-full hover:bg-muted">
                      <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem className="cursor-pointer" onClick={() => openViewSheet(staffMember)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer" onClick={() => openEditSheet(staffMember)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer text-destructive focus:text-destructive"
                        onClick={() => openDeleteDialog(staffMember)}
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
      {/* Edit Staff Sheet */}
      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Edit Staff</SheetTitle>
            <SheetDescription>
              Update the staff member details below.
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
            <div className="relative">
              <Label htmlFor="edit-speciality_id">Speciality</Label>
              <Controller
                name="speciality_id"
                control={editControl}
                rules={{ required: "Speciality is required" }}
                render={({ field, fieldState }) => (
                  <div>
                    <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value.toString()}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select speciality" />
                      </SelectTrigger>
                      <SelectContent>
                        {SPECIALITIES.map((speciality) => (
                          <SelectItem key={speciality.id} value={speciality.id.toString()}>
                            {speciality.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.error && (
                      <p className="mt-1 text-xs text-red-500">{fieldState.error.message}</p>
                    )}
                  </div>
                )}
              />
            </div>
            <div className="relative">
              <Label htmlFor="edit-license_number">License Number</Label>
              <Controller
                name="license_number"
                control={editControl}
                rules={{ required: "License number is required" }}
                render={({ field, fieldState }) => (
                  <div>
                    <Input
                      id="edit-license_number"
                      placeholder="Enter license number"
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
              <Label htmlFor="edit-bio">Bio</Label>
              <Controller
                name="bio"
                control={editControl}
                render={({ field }) => (
                  <Textarea
                    id="edit-bio"
                    placeholder="Enter bio"
                    className="mt-1"
                    {...field}
                  />
                )}
              />
            </div>
            <div className="relative">
              <Label htmlFor="edit-consultation_fees">Consultation Fees</Label>
              <Controller
                name="consultation_fees"
                control={editControl}
                rules={{ required: "Consultation fees are required", min: { value: 0, message: "Fees cannot be negative" } }}
                render={({ field, fieldState }) => (
                  <div>
                    <Input
                      id="edit-consultation_fees"
                      type="number"
                      placeholder="Enter consultation fees"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                    {fieldState.error && (
                      <p className="mt-1 text-xs text-red-500">{fieldState.error.message}</p>
                    )}
                  </div>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <Label htmlFor="edit-start_time">Start Time</Label>
                <Controller
                  name="start_time"
                  control={editControl}
                  rules={{ required: "Start time is required" }}
                  render={({ field, fieldState }) => (
                    <div>
                      <Input
                        id="edit-start_time"
                        type="time"
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
                <Label htmlFor="edit-end_time">End Time</Label>
                <Controller
                  name="end_time"
                  control={editControl}
                  rules={{ required: "End time is required" }}
                  render={({ field, fieldState }) => (
                    <div>
                      <Input
                        id="edit-end_time"
                        type="time"
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
            <div className="relative">
              <Label htmlFor="edit-available_days">Available Days</Label>
              <Controller
                name="available_days"
                control={editControl}
                rules={{ required: "Available days are required", validate: (value) => value.length > 0 || "At least one day must be selected" }}
                render={({ field, fieldState }) => (
                  <div>
                    <Select
                      onValueChange={(value) => {
                        const currentDays = field.value || [];
                        if (currentDays.includes(value)) {
                          field.onChange(currentDays.filter((day: string) => day !== value));
                        } else {
                          field.onChange([...currentDays, value]);
                        }
                      }}
                      value=""
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select available days" />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS.map((day) => (
                          <SelectItem key={day} value={day}>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={field.value.includes(day)}
                                readOnly
                              />
                              {day.charAt(0).toUpperCase() + day.slice(1)}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {field.value.map((day: string) => (
                        <span key={day} className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                          {day.charAt(0).toUpperCase() + day.slice(1)}
                          <button
                            type="button"
                            className="ml-1 text-blue-600 hover:text-blue-800"
                            onClick={() => field.onChange(field.value.filter((d: string) => d !== day))}
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                    {fieldState.error && (
                      <p className="mt-1 text-xs text-red-500">{fieldState.error.message}</p>
                    )}
                  </div>
                )}
              />
            </div>
            <div className="relative">
              <Label htmlFor="edit-profile_image">Profile Image URL</Label>
              <Controller
                name="profile_image"
                control={editControl}
                render={({ field }) => (
                  <Input
                    id="edit-profile_image"
                    placeholder="Enter profile image URL"
                    {...field}
                  />
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
                  "Update Staff"
                )}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
      {/* View Staff Sheet */}
      <Sheet open={isViewSheetOpen} onOpenChange={setIsViewSheetOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Staff Details</SheetTitle>
            <SheetDescription>
              View the details of the staff member below.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {selectedStaff && (
              <>
                <div>
                  <Label>Name</Label>
                  <p className="text-sm text-foreground">{selectedStaff.name ?? 'Unknown'}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="text-sm text-foreground">{selectedStaff.user.email ?? 'No email'}</p>
                </div>
                <div>
                  <Label>Job Title</Label>
                  <p className="text-sm text-foreground">{selectedStaff.job_title ?? 'N/A'}</p>
                </div>
                <div>
                  <Label>Speciality</Label>
                  <p className="text-sm text-foreground">
                    {SPECIALITIES.find(s => s.id === selectedStaff.speciality_id)?.name ?? 'N/A'}
                  </p>
                </div>
                <div>
                  <Label>License Number</Label>
                  <p className="text-sm text-foreground">{selectedStaff.license_number ?? 'N/A'}</p>
                </div>
                <div>
                  <Label>Bio</Label>
                  <p className="text-sm text-foreground">{selectedStaff.bio ?? 'No bio'}</p>
                </div>
                <div>
                  <Label>Consultation Fees</Label>
                  <p className="text-sm text-foreground">{selectedStaff.consultation_fees ? `$${selectedStaff.consultation_fees}` : 'N/A'}</p>
                </div>
                <div>
                  <Label>Working Hours</Label>
                  <p className="text-sm text-foreground">
                    {selectedStaff.start_time && selectedStaff.end_time 
                      ? `${selectedStaff.start_time.slice(0, 5)} - ${selectedStaff.end_time.slice(0, 5)}`
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <Label>Available Days</Label>
                  <p className="text-sm text-foreground">
                    {normalizeWorkingDays(selectedStaff.working_days)?.map(day => day.charAt(0).toUpperCase() + day.slice(1)).join(', ') || 'N/A'}
                  </p>
                </div>
                <div>
                  <Label>Cabinet</Label>
                  <p className="text-sm text-foreground">{selectedStaff.cabinet?.name ?? 'N/A'}</p>
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
              Are you sure you want to delete the staff member {staffToDelete?.name ?? 'Unknown'}? This action cannot be undone.
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

export default OwnerStaffList;
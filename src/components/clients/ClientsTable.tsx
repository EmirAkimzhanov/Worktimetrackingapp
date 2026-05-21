import React, { useEffect, useState, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import {
  Edit,
  Trash2,
  Plus,
  Building,
  Copy,
  Check,
  Hash,
  Building2,
  User,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Download,
} from "lucide-react";
import { Client } from "../../types/types";
import { toast } from "sonner";
import { useDeleteClients, useGetClients, useExportClientsExcel } from "../../hooks/useClients";
import { useUserStore } from "../../store/UsersStore";
import { useGetSectors } from "../../hooks/useSectors";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Sector options based on the actual data
const SECTOR_OPTIONS = [
  { value: "Technology", label: "Technology" },
  { value: "Finance", label: "Finance & Banking" },
  { value: "Healthcare", label: "Healthcare" },
  { value: "Manufacturing", label: "Manufacturing" },
  { value: "Retail", label: "Retail & E-commerce" },
  { value: "Telecommunications", label: "Telecommunications" },
  { value: "Energy", label: "Energy & Utilities" },
  { value: "Transportation", label: "Transportation & Logistics" },
  { value: "Real Estate", label: "Real Estate" },
  { value: "Education", label: "Education" },
  { value: "Hospitality", label: "Hospitality & Tourism" },
  { value: "Media", label: "Media & Entertainment" },
  { value: "Agriculture", label: "Agriculture" },
  { value: "Construction", label: "Construction" },
  { value: "Consulting", label: "Consulting" },
  { value: "Legal", label: "Legal Services" },
  { value: "Pharmaceutical", label: "Pharmaceutical" },
  { value: "Automotive", label: "Automotive" },
  { value: "Aerospace", label: "Aerospace & Defense" },
  { value: "Other", label: "Other" },
];

type SortOption = {
  value: string;
  label: string;
};

const sortOptions: SortOption[] = [
  { value: "name", label: "Name (A-Z)" },
  { value: "-name", label: "Name (Z-A)" },
  { value: "group", label: "Group (A-Z)" },
  { value: "-group", label: "Group (Z-A)" },
  { value: "personal_number", label: "Personal Number (A-Z)" },
  { value: "-personal_number", label: "Personal Number (Z-A)" },
  { value: "sector_name", label: "Sector (A-Z)" },
  { value: "-sector_name", label: "Sector (Z-A)" },
];

interface ClientsTableProps {
  clients: Client[];
  onEdit: (client: Client) => void;
  onDelete: (id: number) => void;
  onAdd: () => void;
}

interface Filters {
  name: string;
  group: string;
  personal_number: string;
  sector_name: string;
}

export function ClientsTable({
  clients,
  onEdit,
  onDelete,
  onAdd,
}: ClientsTableProps) {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const { mutate: getClients, isPending: isLoadingClients } = useGetClients();
  const { mutate: getSectors } = useGetSectors();
  const { mutate: deleteClient } = useDeleteClients();
  const { mutate: exportClients, isPending: isExporting } = useExportClientsExcel();

  const store_clients = useUserStore((state) => state.clients);
  const clientsPagination = useUserStore((state) => state.clientsPagination);
  const store_sectors = useUserStore((state) => state.sectors);

  // ✅ Безопасное преобразование sectors в массив с фильтрацией null
  const sectorsArray = React.useMemo(() => {
    if (!store_sectors) return [];
    if (Array.isArray(store_sectors)) return store_sectors.filter(s => s && s !== null);
    if (typeof store_sectors === 'object') return Object.values(store_sectors).filter(s => s && s !== null);
    return [];
  }, [store_sectors]);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [ordering, setOrdering] = useState<string>("name");
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const pageSize = 30;

  const [localFilters, setLocalFilters] = useState<Filters>({
    name: "",
    group: "",
    personal_number: "",
    sector_name: "",
  });

  const debouncedName = useDebounce(localFilters.name, 500);
  const debouncedGroup = useDebounce(localFilters.group, 500);
  const debouncedPersonalNumber = useDebounce(localFilters.personal_number, 500);
  const debouncedSector = useDebounce(localFilters.sector_name, 300);

  // Загружаем первую страницу клиентов
  useEffect(() => {
    getSectors();
    loadClients(1);
  }, []);

  const loadClients = useCallback((page: number) => {
    const params: any = {
      page,
      page_size: pageSize,
      ordering: ordering,
    };

    if (debouncedName && debouncedName.trim()) params.name = debouncedName;
    if (debouncedGroup && debouncedGroup.trim()) params.group = debouncedGroup;
    if (debouncedPersonalNumber && debouncedPersonalNumber.trim()) params.personal_number = debouncedPersonalNumber;
    if (debouncedSector && debouncedSector.trim()) params.sector_name = debouncedSector;

    console.log("📦 Loading clients with params:", params);
    getClients(params);
    setCurrentPage(page);
  }, [debouncedName, debouncedGroup, debouncedPersonalNumber, debouncedSector, ordering, pageSize, getClients]);

  // Эффект для загрузки клиентов при изменении фильтров
  useEffect(() => {
    if (!isInitialLoad) {
      loadClients(1);
    } else {
      setIsInitialLoad(false);
      loadClients(1);
    }
  }, [debouncedName, debouncedGroup, debouncedPersonalNumber, debouncedSector, ordering]);

  // Функция для получения текущих параметров фильтрации для экспорта
  const getCurrentFilterParams = useCallback(() => {
    const params: any = {};

    if (debouncedName && debouncedName.trim()) params.name = debouncedName;
    if (debouncedGroup && debouncedGroup.trim()) params.group = debouncedGroup;
    if (debouncedPersonalNumber && debouncedPersonalNumber.trim()) params.personal_number = debouncedPersonalNumber;
    if (debouncedSector && debouncedSector.trim()) params.sector_name = debouncedSector;
    if (ordering) params.ordering = ordering;

    return params;
  }, [debouncedName, debouncedGroup, debouncedPersonalNumber, debouncedSector, ordering]);

  // Функция для экспорта в Excel
  const handleExportExcel = () => {
    const filterParams = getCurrentFilterParams();
    console.log('📊 Exporting clients with params:', filterParams);
    exportClients(filterParams);
  };

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setLocalFilters({
      name: "",
      group: "",
      personal_number: "",
      sector_name: "",
    });
    setCurrentPage(1);
  };

  // ✅ Исправлено: безопасное получение данных с проверкой на массив
  const displayClients = React.useMemo(() => {
    if (store_clients && Array.isArray(store_clients) && store_clients.length > 0) {
      return store_clients;
    }
    if (clients && Array.isArray(clients) && clients.length > 0) {
      return clients;
    }
    return [];
  }, [store_clients, clients]);

  const totalCount = clientsPagination?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);
  const hasNext = !!clientsPagination?.next;
  const hasPrev = !!clientsPagination?.previous;

  const handleNextPage = () => {
    if (hasNext) {
      loadClients(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (hasPrev) {
      loadClients(currentPage - 1);
    }
  };

  const handleGoToPage = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      loadClients(page);
    }
  };

  const copyToClipboard = async (text: string, itemName: string) => {
    if (!text || text === "N/A") return;

    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      toast.success(`${itemName} copied to clipboard`);

      setTimeout(() => {
        setCopiedText(null);
      }, 2000);
    } catch (err) {
      toast.error(`Failed to copy ${itemName}`);
    }
  };

  const handleDeleteClick = (client: Client) => {
    if (client && client.id) {
      setClientToDelete({
        id: client.id,
        name: client.name || "Unknown",
      });
      setDeleteDialogOpen(true);
    }
  };

  const handleConfirmDelete = () => {
    if (clientToDelete && clientToDelete.id) {
      deleteClient(clientToDelete.id.toString(), {
        onSuccess: () => {
          loadClients(currentPage);
          onDelete(clientToDelete.id);
          setDeleteDialogOpen(false);
          setClientToDelete(null);
          toast.success("Client deleted successfully");
        },
        onError: (error) => {
          console.error("Error deleting client:", error);
          toast.error("Failed to delete client");
          setDeleteDialogOpen(false);
          setClientToDelete(null);
        },
      });
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setClientToDelete(null);
  };

  const getSectorLabel = (sectorValue: string): string => {
    if (!sectorValue || sectorValue === "N/A") return "Not specified";
    const sector = SECTOR_OPTIONS.find(
      (s) => s.value.toLowerCase() === sectorValue.toLowerCase(),
    );
    return sector ? sector.label : sectorValue;
  };

  // Функция для отображения номеров страниц
  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      pages.push(
        <Button
          key="1"
          variant="outline"
          size="sm"
          onClick={() => handleGoToPage(1)}
          disabled={isLoadingClients}
          className="min-w-[40px] hidden sm:inline-flex"
        >
          1
        </Button>
      );
      if (startPage > 2) {
        pages.push(
          <span key="ellipsis1" className="px-1 text-muted-foreground hidden sm:inline">
            ...
          </span>
        );
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Button
          key={i}
          variant={currentPage === i ? "default" : "outline"}
          size="sm"
          onClick={() => handleGoToPage(i)}
          disabled={isLoadingClients}
          className="min-w-[40px]"
        >
          {i}
        </Button>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <span key="ellipsis2" className="px-1 text-muted-foreground hidden sm:inline">
            ...
          </span>
        );
      }
      pages.push(
        <Button
          key={totalPages}
          variant="outline"
          size="sm"
          onClick={() => handleGoToPage(totalPages)}
          disabled={isLoadingClients}
          className="min-w-[40px] hidden sm:inline-flex"
        >
          {totalPages}
        </Button>
      );
    }

    return pages;
  };

  const activeFiltersCount = Object.values(localFilters).filter(v => v && v !== '').length;

  // Показываем лоадер при первой загрузке
  if (isLoadingClients && displayClients.length === 0 && isInitialLoad) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Clients</h2>
            <p className="text-muted-foreground">Loading clients...</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={onAdd} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Client
            </Button>
          </div>
        </div>
        <div className="rounded-md border p-8 text-center text-slate-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          Loading clients...
        </div>
      </div>
    );
  }

  const hasClients = displayClients.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Clients</h2>
          <p className="text-muted-foreground">
            {totalCount > 0 ? `Total: ${totalCount} clients` : `${displayClients.length} client${displayClients.length !== 1 ? "s" : ""} found`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleExportExcel}
            size="sm"
            variant="outline"
            disabled={isExporting || isLoadingClients}
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export to Excel'}
          </Button>
          <Button onClick={onAdd} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Client
          </Button>
        </div>
      </div>

      {/* Filters Row */}
      <div className="overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max">
          <div className="relative w-[150px]">
            <Input
              placeholder="Client name..."
              value={localFilters.name}
              onChange={(e) => handleFilterChange('name', e.target.value)}
              className="text-xs pl-7 h-7"
              autoComplete="off"
            />
          </div>

          <div className="relative w-[120px]">
            <Input
              placeholder="Group..."
              value={localFilters.group}
              onChange={(e) => handleFilterChange('group', e.target.value)}
              className="text-xs pl-7 h-7"
              autoComplete="off"
            />
          </div>

          <div className="relative w-[130px]">
            <Input
              placeholder="Personal number..."
              value={localFilters.personal_number}
              onChange={(e) => handleFilterChange('personal_number', e.target.value)}
              className="text-xs pl-7 h-7"
              autoComplete="off"
            />
          </div>

          {/* ✅ Исправленный Select для секторов */}
          <Select
            value={localFilters.sector_name || "all"}
            onValueChange={(value) => handleFilterChange('sector_name', value === "all" ? "" : value)}
          >
            <SelectTrigger className="h-7 w-[130px] text-xs">
              <SelectValue placeholder="Sector" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sectors</SelectItem>
              {sectorsArray.map((sector: any, idx: number) => {
                if (!sector || sector === null) return null;
                return (
                  <SelectItem key={sector.id || idx} value={sector.name || String(sector.id)}>
                    {sector.name || 'Unknown'}
                  </SelectItem>
                );
              }).filter(Boolean)}
            </SelectContent>
          </Select>

          <Select
            value={ordering}
            onValueChange={(value) => setOrdering(value)}
          >
            <SelectTrigger className="h-7 w-[140px] text-xs">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {activeFiltersCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              title="Clear all filters"
              className="h-7 px-2"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client Name</TableHead>
              <TableHead>Group</TableHead>
              <TableHead>Personal Number</TableHead>
              <TableHead>Sector</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!hasClients ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-slate-500 py-8"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Building className="w-12 h-12 text-slate-300" />
                    <p className="text-lg font-medium">No clients found</p>
                    <p className="text-sm text-slate-500">
                      {activeFiltersCount > 0
                        ? "No clients match your filters. Try clearing them."
                        : "Click \"Add Client\" to create your first client"}
                    </p>
                    {activeFiltersCount > 0 && (
                      <Button variant="outline" size="sm" onClick={clearFilters}>
                        Clear Filters
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              displayClients.map((client) => {
                if (!client) return null;

                const sectorLabel = client.sector_name || client.sector
                  ? getSectorLabel(client.sector_name || client.sector)
                  : "Not specified";

                return (
                  <TableRow
                    key={client.id || Math.random()}
                    className="hover:bg-slate-50"
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-slate-500" />
                        <div>
                          <div>{client.name || "Unnamed"}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {client.group || (
                          <span className="text-gray-400 italic">No group</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {client.personal_number &&
                          client.personal_number !== "N/A" ? (
                          <>
                            <div className="flex items-center gap-1">
                              <Hash className="w-3 h-3 text-gray-400" />
                              <span className="font-mono text-sm">
                                {client.personal_number}
                              </span>
                            </div>
                          </>
                        ) : (
                          <span className="text-gray-400 italic text-sm">
                            N/A
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {client.sector_name || client.sector ? (
                        <Badge variant="secondary" className="text-xs">
                          <div className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            <span className="truncate max-w-[150px]">
                              {sectorLabel}
                            </span>
                          </div>
                        </Badge>
                      ) : (
                        <span className="text-gray-400 italic text-sm">
                          Not specified
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => client && onEdit(client)}
                          title="Edit client"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => client && handleDeleteClick(client)}
                          title="Delete client"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Улучшенная пагинация */}
      {
        totalPages > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4">
            <div className="text-xs text-muted-foreground">
              Showing {displayClients.length} of {totalCount} clients
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={!hasPrev || isLoadingClients}
                className="h-7 text-xs"
              >
                <ChevronLeft size={12} className="mr-1" />
                Previous
              </Button>

              <div className="hidden md:flex gap-1">
                {renderPageNumbers()}
              </div>

              <div className="flex md:hidden items-center gap-2">
                <Select
                  value={currentPage.toString()}
                  onValueChange={(value) => handleGoToPage(parseInt(value))}
                  disabled={isLoadingClients}
                >
                  <SelectTrigger className="w-[100px] h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <SelectItem key={page} value={page.toString()}>
                        Page {page} of {totalPages}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="hidden sm:flex md:hidden items-center gap-2 text-xs">
                <span className="font-medium">{currentPage}</span>
                <span className="text-muted-foreground">of {totalPages}</span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={!hasNext || isLoadingClients}
                className="h-7 text-xs"
              >
                Next
                <ChevronRight size={12} className="ml-1" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                Go to:
              </span>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={currentPage}
                onChange={(e) => {
                  const page = parseInt(e.target.value);
                  if (!isNaN(page) && page >= 1 && page <= totalPages) {
                    handleGoToPage(page);
                  }
                }}
                className="w-14 h-7 px-2 text-xs border rounded-md"
                disabled={isLoadingClients}
              />
            </div>
          </div>
        )
      }

      {
        totalPages > 0 && (
          <div className="text-center text-xs text-muted-foreground pt-2">
            Page {currentPage} of {totalPages} • Total {totalCount} clients
          </div>
        )
      }

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {clientToDelete && (
                <>
                  This action cannot be undone. This will permanently delete the
                  client{" "}
                  <span className="font-semibold text-red-600">
                    {clientToDelete.name}
                  </span>{" "}
                  from the system.
                  <div className="mt-3 p-3 bg-red-50 rounded-md">
                    <p className="text-sm text-red-700 font-medium">
                      ⚠️ Warning: All data associated with this client will be
                      lost.
                    </p>
                  </div>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Client
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div >
  );
}
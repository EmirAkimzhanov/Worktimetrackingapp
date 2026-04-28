import React, { useEffect, useState } from "react";
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
} from "lucide-react";
import { Client } from "../../types/types";
import { toast } from "sonner";
import { useDeleteClients, useGetClients } from "../../hooks/useClients";
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

interface ClientsTableProps {
  clients: Client[];
  onEdit: (client: Client) => void;
  onDelete: (id: number) => void;
  onAdd: () => void;
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

  const store_clients = useUserStore((state) => state.clients);
  const clientsPagination = useUserStore((state) => state.clientsPagination);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 30;

  // Загружаем первую страницу клиентов
  useEffect(() => {
    loadClients(1);
    if (getSectors) {
      getSectors();
    }
  }, []);

  const loadClients = (page: number) => {
    getClients({ page, page_size: pageSize });
    setCurrentPage(page);
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

  // Показываем лоадер при первой загрузке
  if (isLoadingClients && displayClients.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Clients</h2>
            <p className="text-muted-foreground">Loading clients...</p>
          </div>
          <Button onClick={onAdd} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Client
          </Button>
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
        <Button onClick={onAdd} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </Button>
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
                      Click "Add Client" to create your first client
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              displayClients.map((client) => {
                if (!client) return null;

                const sectorLabel = client.sector
                  ? getSectorLabel(client.sector)
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
                            <User className="w-3 h-3" />
                            ID: {client.id || "N/A"}
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
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() =>
                                copyToClipboard(
                                  client.personal_number!,
                                  "Personal number",
                                )
                              }
                            >
                              {copiedText === client.personal_number ? (
                                <Check className="w-3 h-3 text-green-600" />
                              ) : (
                                <Copy className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                              )}
                            </Button>
                          </>
                        ) : (
                          <span className="text-gray-400 italic text-sm">
                            N/A
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {client.sector && client.sector !== "N/A" ? (
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
                          onClick={() => client && onEdit(client)}
                          title="Edit client"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => client && handleDeleteClick(client)}
                          title="Delete client"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
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

      {/* Пагинация */}
      {(hasNext || hasPrev) && (
        <div className="flex justify-between items-center pt-4">
          <div className="text-xs text-muted-foreground">
            Showing {displayClients.length} of {totalCount} clients
          </div>
          <div className="flex gap-2 items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={!hasPrev || isLoadingClients}
            >
              <ChevronLeft size={14} className="mr-1" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              Page {currentPage}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={!hasNext || isLoadingClients}
            >
              Next
              <ChevronRight size={14} className="ml-1" />
            </Button>
          </div>
        </div>
      )}

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
    </div>
  );
}
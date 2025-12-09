"use client";

import { useState, useEffect } from "react";
import {
    Gift,
    Plus,
    Trash2,
    Edit,
    CheckCircle2,
    XCircle,
    Loader2,
    ShieldCheck,
    ArrowLeft,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import {
    getAllPromotions,
    createPromotion,
    updatePromotion,
    deletePromotion,
    seedWelcome1000Promotion,
    type Promotion,
} from "@/lib/firebase/promotions";

export default function PromotionsPage() {
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        creditAmount: 1000,
        appliesTo: "first_shift" as "first_shift" | "any_shift",
        expiryDays: 30,
        useLimitPerEmployer: 1,
        isActive: true,
        description: "",
    });

    useEffect(() => {
        loadPromotions();
    }, []);

    const loadPromotions = async () => {
        try {
            setIsLoading(true);
            // Seed Welcome1000 if it doesn't exist
            await seedWelcome1000Promotion();
            const data = await getAllPromotions();
            setPromotions(data);
        } catch (error) {
            console.error("Error loading promotions:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenCreateDialog = () => {
        setSelectedPromotion(null);
        setFormData({
            name: "",
            creditAmount: 1000,
            appliesTo: "first_shift",
            expiryDays: 30,
            useLimitPerEmployer: 1,
            isActive: true,
            description: "",
        });
        setIsDialogOpen(true);
    };

    const handleOpenEditDialog = (promotion: Promotion) => {
        setSelectedPromotion(promotion);
        setFormData({
            name: promotion.name,
            creditAmount: promotion.creditAmount,
            appliesTo: promotion.appliesTo,
            expiryDays: promotion.expiryDays,
            useLimitPerEmployer: promotion.useLimitPerEmployer,
            isActive: promotion.isActive,
            description: promotion.description || "",
        });
        setIsDialogOpen(true);
    };

    const handleOpenDeleteDialog = (promotion: Promotion) => {
        setSelectedPromotion(promotion);
        setIsDeleteDialogOpen(true);
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            if (selectedPromotion) {
                await updatePromotion(selectedPromotion.id!, formData);
            } else {
                await createPromotion(formData);
            }
            await loadPromotions();
            setIsDialogOpen(false);
        } catch (error) {
            console.error("Error saving promotion:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedPromotion) return;
        try {
            setIsSaving(true);
            await deletePromotion(selectedPromotion.id!);
            await loadPromotions();
            setIsDeleteDialogOpen(false);
        } catch (error) {
            console.error("Error deleting promotion:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleActive = async (promotion: Promotion) => {
        try {
            await updatePromotion(promotion.id!, { isActive: !promotion.isActive });
            await loadPromotions();
        } catch (error) {
            console.error("Error toggling promotion:", error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/dashboard/superadmin">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <ShieldCheck className="h-6 w-6" />
                    <h1 className="font-headline text-xl font-semibold">
                        Promotions Management
                    </h1>
                </div>
            </header>

            <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-4 md:gap-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Gift className="h-5 w-5 text-accent" />
                                Active Promotions
                            </CardTitle>
                            <CardDescription>
                                Manage promotional offers for employers and professionals.
                            </CardDescription>
                        </div>
                        <Button onClick={handleOpenCreateDialog}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Promotion
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Credit Amount</TableHead>
                                    <TableHead>Applies To</TableHead>
                                    <TableHead>Expiry (Days)</TableHead>
                                    <TableHead>Limit/Employer</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {promotions.map((promo) => (
                                    <TableRow key={promo.id}>
                                        <TableCell>
                                            <div className="font-medium">{promo.name}</div>
                                            {promo.description && (
                                                <div className="text-xs text-muted-foreground max-w-[200px] truncate">
                                                    {promo.description}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-semibold text-accent">
                                                KSh {promo.creditAmount.toLocaleString()}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize">
                                                {promo.appliesTo.replace("_", " ")}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{promo.expiryDays} days</TableCell>
                                        <TableCell>{promo.useLimitPerEmployer}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    checked={promo.isActive}
                                                    onCheckedChange={() => handleToggleActive(promo)}
                                                />
                                                <Badge
                                                    variant={promo.isActive ? "default" : "secondary"}
                                                    className={promo.isActive ? "bg-green-500/20 text-green-500" : ""}
                                                >
                                                    {promo.isActive ? (
                                                        <><CheckCircle2 className="h-3 w-3 mr-1" /> Active</>
                                                    ) : (
                                                        <><XCircle className="h-3 w-3 mr-1" /> Inactive</>
                                                    )}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleOpenEditDialog(promo)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                                    onClick={() => handleOpenDeleteDialog(promo)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {promotions.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                            No promotions found. Create your first promotion!
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Promotion Info Card */}
                <Card className="border-accent/30 bg-accent/5">
                    <CardHeader>
                        <CardTitle className="text-lg">Welcome1000 Promotion</CardTitle>
                        <CardDescription>
                            Default welcome promotion for new employers
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="rounded-lg bg-background p-4 border">
                                <div className="text-sm text-muted-foreground">Promo Name</div>
                                <div className="font-semibold">Welcome1000</div>
                            </div>
                            <div className="rounded-lg bg-background p-4 border">
                                <div className="text-sm text-muted-foreground">Credit Amount</div>
                                <div className="font-semibold text-accent">KSh 1,000</div>
                            </div>
                            <div className="rounded-lg bg-background p-4 border">
                                <div className="text-sm text-muted-foreground">Applies To</div>
                                <div className="font-semibold">First Shift Only</div>
                            </div>
                            <div className="rounded-lg bg-background p-4 border">
                                <div className="text-sm text-muted-foreground">Expiry</div>
                                <div className="font-semibold">30 days after sign-up</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </main>

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedPromotion ? "Edit Promotion" : "Create Promotion"}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedPromotion
                                ? "Update the promotion details below."
                                : "Enter the details for the new promotion."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Promotion Name</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Welcome1000"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="creditAmount">Credit Amount (KSh)</Label>
                            <Input
                                id="creditAmount"
                                type="number"
                                value={formData.creditAmount}
                                onChange={(e) =>
                                    setFormData({ ...formData, creditAmount: parseInt(e.target.value) || 0 })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="appliesTo">Applies To</Label>
                            <Select
                                value={formData.appliesTo}
                                onValueChange={(value: "first_shift" | "any_shift") =>
                                    setFormData({ ...formData, appliesTo: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="first_shift">First Shift Only</SelectItem>
                                    <SelectItem value="any_shift">Any Shift</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="expiryDays">Expiry (Days)</Label>
                                <Input
                                    id="expiryDays"
                                    type="number"
                                    value={formData.expiryDays}
                                    onChange={(e) =>
                                        setFormData({ ...formData, expiryDays: parseInt(e.target.value) || 30 })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="useLimitPerEmployer">Use Limit</Label>
                                <Input
                                    id="useLimitPerEmployer"
                                    type="number"
                                    value={formData.useLimitPerEmployer}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            useLimitPerEmployer: parseInt(e.target.value) || 1,
                                        })
                                    }
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description (Optional)</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Enter a description for this promotion..."
                                rows={2}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <Switch
                                id="isActive"
                                checked={formData.isActive}
                                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                            />
                            <Label htmlFor="isActive">Active</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving || !formData.name}>
                            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {selectedPromotion ? "Update" : "Create"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Promotion</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete &quot;{selectedPromotion?.name}&quot;? This action
                            cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isSaving}>
                            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

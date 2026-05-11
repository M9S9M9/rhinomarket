import type {
  User, Listing, Category, Review, Transaction, Favorite,
  Download, Earnings, Withdrawal, Dispute, DesignerApplication,
  PayoutMethod, DMCAReport,
  UserRole, ListingStatus, LicenseType, PaymentStatus,
  PayoutStatus, WithdrawalStatus, DisputeStatus,
} from "@prisma/client";

export type {
  User, Listing, Category, Review, Transaction, Favorite,
  Download, Earnings, Withdrawal, Dispute, DesignerApplication,
  PayoutMethod, DMCAReport,
  UserRole, ListingStatus, LicenseType, PaymentStatus,
  PayoutStatus, WithdrawalStatus, DisputeStatus,
};

export interface ListingWithRelations extends Listing {
  designer: Pick<User, "id" | "name" | "avatarUrl">;
  category?: Pick<Category, "id" | "name" | "slug"> | null;
  _count?: {
    reviews: number;
    favorites: number;
  };
  avgRating?: number;
}

export interface TransactionWithListing extends Transaction {
  listing: Pick<Listing, "id" | "title" | "slug" | "thumbnailUrl">;
}

export interface DashboardStats {
  totalListings: number;
  activeListings: number;
  totalSales: number;
  totalRevenue: number;
  pendingPayout: number;
  totalViews: number;
  totalDownloads: number;
  averageRating: number;
}

export interface SearchFilters {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  licenseType?: LicenseType;
  sort?: "newest" | "popular" | "price_asc" | "price_desc" | "rating";
  page?: number;
  limit?: number;
}

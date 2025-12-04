import { prisma } from "../lib/prisma.js";

export interface CreatePartnerLeadData {
  businessName: string;
  contactName: string;
  phone: string;
  email: string;
}

/**
 * Create a new partner lead
 */
export async function createPartnerLead(data: CreatePartnerLeadData) {
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    throw new Error("Invalid email format");
  }

  // Validate phone format (basic validation)
  const phoneRegex = /^[0-9+\-\s()]+$/;
  if (!phoneRegex.test(data.phone)) {
    throw new Error("Invalid phone format");
  }

  const lead = await prisma.partnerLead.create({
    data: {
      businessName: data.businessName.trim(),
      contactName: data.contactName.trim(),
      phone: data.phone.trim(),
      email: data.email.trim(),
    },
  });

  return {
    id: lead.id,
    business_name: lead.businessName,
    contact_name: lead.contactName,
    phone: lead.phone,
    email: lead.email,
    created_at: lead.createdAt,
  };
}

/**
 * Get all partner leads (Admin)
 */
export async function getAllPartnerLeads(
  filters: {
    limit?: number;
    page?: number;
    sortBy?: "businessName" | "createdAt";
    sortOrder?: "asc" | "desc";
  } = {}
) {
  const limit = Math.min(filters.limit || 20, 100);
  const page = filters.page || 1;
  const skip = (page - 1) * limit;
  const sortBy = filters.sortBy || "createdAt";
  const sortOrder = filters.sortOrder || "desc";

  const [leads, total] = await Promise.all([
    prisma.partnerLead.findMany({
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
    }),
    prisma.partnerLead.count(),
  ]);

  return {
    data: leads.map((lead) => ({
      id: lead.id,
      business_name: lead.businessName,
      contact_name: lead.contactName,
      phone: lead.phone,
      email: lead.email,
      created_at: lead.createdAt,
    })),
    pagination: {
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      pageSize: limit,
    },
  };
}

/**
 * Get a single partner lead by ID
 */
export async function getPartnerLeadById(id: string) {
  const lead = await prisma.partnerLead.findUnique({
    where: { id },
  });

  if (!lead) {
    throw new Error("Partner lead not found");
  }

  return {
    id: lead.id,
    business_name: lead.businessName,
    contact_name: lead.contactName,
    phone: lead.phone,
    email: lead.email,
    created_at: lead.createdAt,
  };
}

/**
 * Delete a partner lead
 */
export async function deletePartnerLead(id: string) {
  await prisma.partnerLead.delete({
    where: { id },
  });
}

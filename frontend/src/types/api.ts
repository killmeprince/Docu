export type Session = {
  token: string;
  username: string;
  fullName: string;
  roles: string[];
};

export type LoginRequest = {
  username: string;
  password: string;
};

export type AuthResponse = {
  token: string;
  username: string;
  fullName: string;
  roles: string[];
};

export type DocumentResponse = {
  id: number;
  documentTypeId: number;
  typeCode: string;
  type: string;
  registrationNumber: string;
  registrationDate: string;
  title: string;
  description: string;
  authorUsername: string;
  author: string;
  status: string;
  updatedAt: string;
  latestVersionNumber: number | null;
  latestFileName: string | null;
  latestFileUrl: string | null;
  editable: boolean;
};

export type FileAttachmentResponse = {
  id: number;
  originalName: string;
  sizeBytes: number;
  downloadUrl: string;
};

export type DocumentVersionResponse = {
  id: number;
  versionNumber: number;
  changeComment: string;
  createdAt: string;
  attachments: FileAttachmentResponse[];
};

export type DocumentDetailsResponse = {
  id: number;
  documentTypeId: number;
  typeCode: string;
  type: string;
  registrationNumber: string;
  registrationDate: string;
  title: string;
  description: string;
  authorUsername: string;
  author: string;
  status: string;
  updatedAt: string;
  editable: boolean;
  versions: DocumentVersionResponse[];
};

export type DocumentCreateRequest = {
  documentTypeId: number;
  registrationNumber: string;
  title: string;
  description: string;
  changeComment: string;
};

export type DocumentUpdateRequest = {
  documentTypeId: number;
  title: string;
  description: string;
  changeComment: string;
};

export type ApprovalStepResponse = {
  id: number;
  order: number;
  approver: string;
  status: string;
  comment: string | null;
  decidedAt: string | null;
};

export type ApprovalDecisionRequest = {
  decision: 'APPROVE' | 'REWORK' | 'REJECT';
  comment: string;
};

export type AuditEventResponse = {
  actor: string;
  type: string;
  details: string;
  createdAt: string;
};

export type ReportResponse = {
  totalDocuments: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  reworkCount: number;
  inApprovalCount: number;
  approvedCount: number;
  rejectedCount: number;
  pendingStepCount: number;
};

export type DocumentTypeResponse = {
  id: number;
  code: string;
  name: string;
  active: boolean;
};

export type DocumentTypeRequest = {
  code: string;
  name: string;
  active: boolean;
};

export type UserResponse = {
  id: number;
  username: string;
  fullName: string;
  active: boolean;
  roles: string[];
};

export type DocumentsFilter = {
  registrationNumber?: string;
  status?: string;
  typeId?: string;
  author?: string;
};

export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

export interface Auditable extends Timestamps {
  createdBy?: string;
  updatedBy?: string;
}

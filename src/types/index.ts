export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role_title: string;
}

export interface DocumentShare {
  id: string;
  document_id: string;
  user_id: string;
  permission: 'view' | 'comment' | 'edit';
  shared_at: string;
  name?: string;
  email?: string;
  avatar?: string;
  role_title?: string;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  title: string;
  content: string;
  created_by: string;
  created_at: string;
  summary?: string;
  creator_name?: string;
  creator_avatar?: string;
}

export interface DocumentComment {
  id: string;
  document_id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  text: string;
  selected_text?: string;
  created_at: string;
  resolved?: boolean;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  owner_name?: string;
  owner_avatar?: string;
  is_public?: boolean;
  public_permission?: 'view' | 'comment' | 'edit';
  permission: 'owner' | 'edit' | 'comment' | 'view';
  shares?: DocumentShare[];
  comments?: DocumentComment[];
}


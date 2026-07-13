export interface InboundMail {
  from: string;
  fromAddress: string;
  to: string;
  subject: string;
  text: string;
  attachmentCount: number;
  messageId: string | null;
}

export interface ThreadRecord {
  fromEmail: string;
  toEmail: string;
  subject: string;
  messageId: string | null;
}

export interface Lead {
  type: string;
  fields: Record<string, string>;
}

export type Chat = {
  name: string;
  dirName: string;
  lastSent: number;
  title: string;
};

export enum MessageType {
  Generic = 'Generic',
  Unsubscribe = 'Unsubscribe',
  Subscribe = 'Subscribe',
  Call = 'Call',
  Share = 'Share',
}

export type Message = {
  users: {
    name: string;
  }[];
  call_duration: number;
  share?: {
    link: string;
  };
  photos?: {
    uri: string;
    creation_timestamp: number;
  }[];
  sticker?: {
    uri: string;
  };
  sender_name: string;
  timestamp_ms: number;
  content?: string;
  is_unsent: boolean;
  reactions?: {
    reaction: string;
    actor: string;
  }[];
};

export type MessageData = {
  messages: Message[];
  participants: {
    name: string;
  }[];
  title: string;
  is_still_participant: boolean;
  // TODO:
  thread_type: string;
  thread_path: string;
};

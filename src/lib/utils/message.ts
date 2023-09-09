import { useMemo } from 'react';

import { getSubDirs, readAutofillInformation, readMessagesJSON } from './file';

import { Chat, Message, MessageData } from '@/types';

const decoder = new TextDecoder('utf-8');

export function decodeString(str: string) {
  return decoder.decode(
    new Uint8Array(str.split('').map((s) => s.charCodeAt(0)))
  );
}

export async function getMyselfName(
  dir: FileSystemDirectoryHandle
): Promise<string | null> {
  const json = await readAutofillInformation(dir);
  if (json) {
    const autofill = JSON.parse(json);
    return decodeString(
      autofill['autofill_information_v2']?.['FULL_NAME']?.[0]
    ) as string;
  } else {
    return null;
  }
}

const chatCache = new Map<string, string>();

export async function loadChats(
  inboxDir: FileSystemDirectoryHandle | null
): Promise<Chat[]> {
  if (!inboxDir) {
    return [];
  }

  const subDirs = await getSubDirs(inboxDir);
  return Promise.all(
    subDirs.map(async (dir) => {
      const messagesJSON = await readMessagesJSON(dir);
      if (messagesJSON) {
        const messageDataParts: MessageData[] = messagesJSON.map(
          (messagesPart) => JSON.parse(messagesPart) as MessageData
        );
        const messageData: MessageData = {
          ...messageDataParts[0],
          messages: messageDataParts.flatMap((data) => data.messages),
        };

        chatCache.set(dir.name, JSON.stringify(messageData));

        const name = decodeString(messageData.participants[0].name);

        const lastSent = messageData.messages.sort(
          (a, b) => a.timestamp_ms - b.timestamp_ms
        )[0].timestamp_ms;

        return {
          name,
          dirName: dir.name,
          lastSent,
          title: decodeString(messageData.title),
        } as Chat;
      } else {
        return null;
      }
    })
  ).then((chats) => chats.filter(Boolean)) as Promise<Chat[]>;
}

export function useCurrentMessage(folderName: string | null) {
  return useMemo<MessageData | null>(() => {
    if (!folderName) {
      return null;
    }

    if (chatCache.has(folderName)) {
      return JSON.parse(chatCache.get(folderName) as string);
    } else {
      return null;
    }
  }, [folderName]);
}

// Group message by consecutive sender name
export function useGroupedMessages(currentMessageData: MessageData | null) {
  return useMemo<Message[][]>(() => {
    if (!currentMessageData) {
      return [];
    }

    const messages = currentMessageData.messages.sort(
      (a, b) => a.timestamp_ms - b.timestamp_ms
    );

    const groupedMessages: Message[][] = [];

    let currentGroup: Message[] = [];
    let currentSender = messages[0].sender_name;

    for (const message of messages) {
      if (message.sender_name === currentSender) {
        currentGroup.push(message);
      } else {
        groupedMessages.push(currentGroup);
        currentGroup = [message];
        currentSender = message.sender_name;
      }
    }

    groupedMessages.push(currentGroup);

    return groupedMessages;
  }, [currentMessageData]);
}

function countMessageBySenderName(messages: Message[]) {
  const count: { [senderName: string]: number } = {};
  for (const message of messages) {
    count[message.sender_name] = (count[message.sender_name] || 0) + 1;
  }
  return count;
}

export function useChatStatistics(currentMessageData: MessageData | null) {
  return useMemo(() => {
    if (!currentMessageData) {
      return null;
    }

    const countInfo = countMessageBySenderName(currentMessageData.messages);
    const createdAt = currentMessageData.messages.sort(
      (a, b) => a.timestamp_ms - b.timestamp_ms
    )[0].timestamp_ms;

    return {
      countInfo,
      createdAt,
    };
  }, [currentMessageData]);
}

export function groupActorsByReaction(
  reactions: Required<Message>['reactions']
) {
  return reactions.reduce((acc, cur) => {
    if (!acc[cur.reaction]) {
      acc[cur.reaction] = [cur.actor];
    } else {
      if (!acc[cur.reaction].includes(cur.actor)) {
        acc[cur.reaction].push(cur.actor);
      }
    }
    return acc;
  }, {} as Record<string, string[]>);
}

export function useGroupedActorsByReaction(message: Message) {
  return useMemo(() => {
    if (!message.reactions) {
      return null;
    }

    return groupActorsByReaction(message.reactions);
  }, [message]);
}

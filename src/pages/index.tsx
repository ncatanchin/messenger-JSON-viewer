import {
  InformationCircleIcon,
  MoonIcon,
  RefreshIcon,
  SearchIcon,
  SunIcon,
} from '@heroicons/react/outline';
import cx from 'classnames';
import randomColor from 'randomcolor';
import { useMemo, useState } from 'react';
import useSWR from 'swr';

import useTheme from '@/lib/hooks/useTheme';
import useToggle from '@/lib/hooks/useToggle';
import { findInboxFolder } from '@/lib/utils/file';
import {
  decodeString,
  getMyselfName,
  loadChats,
  useChatStatistics,
  useCurrentMessage,
  useGroupedMessages,
} from '@/lib/utils/message';

import Collapsible from '@/components/Collapsible';
import MessageComponent from '@/components/Message';

function StartScreen({ openDirPicker }: { openDirPicker: () => void }) {
  return (
    <div className='flex h-full flex-col items-center justify-center'>
      <div>
        <button
          className='rounded px-4 py-2 ring-1 hover:bg-indigo-500 hover:text-white'
          onClick={openDirPicker}
        >
          Select Messenger archived folder
        </button>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [directory, setDirectory] = useState<FileSystemDirectoryHandle | null>(
    null
  );
  const [inboxDir, setInboxDir] = useState<FileSystemDirectoryHandle | null>(
    null
  );
  const [search, setSearch] = useState('');
  const [infoPanelOpen, , toggleInfoPanel] = useToggle(false);
  const [chatMembersInfoExpanded, , toggleChatMembersInfo] = useToggle(false);
  const [messageCountExpanded, , toggleMessageCount] = useToggle(false);
  const [chatInfoExpanded, , toggleChatInfo] = useToggle(false);

  const [folderName, setFolderName] = useState<string | null>(null);
  const currentMessage = useCurrentMessage(folderName);
  const groupedMessages = useGroupedMessages(currentMessage);
  const chatStatistic = useChatStatistics(currentMessage);

  const { dark, toggleTheme, theme } = useTheme();

  const { data } = useSWR('chats', () => loadChats(inboxDir));
  const { data: myName = null } = useSWR(
    () => (directory ? 'myName' : false),
    () => {
      return getMyselfName(directory!);
    }
  );

  const chats = useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }

    return data
      .sort((a, b) => b.lastSent - a.lastSent)
      .filter((c) => c.title.includes(search) || c.dirName.includes(search));
  }, [data, search]);

  const openDirPicker = async () => {
    try {
      const directoryHandle = await window.showDirectoryPicker();

      const inbox = await findInboxFolder(directoryHandle);

      if (inbox) {
        setInboxDir(inbox);
        setDirectory(directoryHandle);
      } else {
        window.alert('This is not a valid Messenger archive folder.');
      }
      // eslint-disable-next-line no-empty
    } catch {}
  };

  if (!data || data.length === 0) {
    return <StartScreen openDirPicker={openDirPicker} />;
  } else {
    return (
      <div className='flex h-full'>
        {/* Sidebar */}
        <div
          className='flex h-full max-h-full w-full flex-col border-r border-solid dark:border-gray-600'
          style={{ maxWidth: 350 }}
        >
          <div className='flex flex-col items-start justify-center border-b border-solid px-4 py-4 dark:border-gray-600'>
            <div className='mb-4 flex w-full items-center justify-between'>
              <h3 className='select-none text-lg font-semibold'>
                {myName}&#39;s chat history
              </h3>

              <div className='flex gap-2'>
                <button
                  className='rounded-full border-none p-2 hover:bg-gray-100 hover:dark:bg-gray-600'
                  onClick={toggleTheme}
                >
                  {dark ? <MoonIcon width={18} /> : <SunIcon width={18} />}
                </button>

                <button className='rounded-full border-none p-2 hover:bg-gray-100 hover:dark:bg-gray-600'>
                  <RefreshIcon width={18} />
                </button>
              </div>
            </div>

            <label className='relative w-full flex-1'>
              <input
                placeholder='Search for user...'
                className='w-full select-none rounded-lg border-none bg-gray-100 py-2 px-4 pl-8 text-sm text-gray-500 outline-none ring-1 ring-gray-100 focus:ring-2 focus:ring-blue-200 dark:bg-slate-600 dark:text-white dark:ring-gray-500 dark:placeholder:text-gray-400 dark:focus:ring-blue-300'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <SearchIcon
                className='absolute top-0 left-2.5 h-full stroke-gray-500 dark:stroke-gray-400'
                width={16}
                height={16}
              />
            </label>
          </div>

          {chats.length > 0 && (
            <div className='overflow-y-auto overflow-x-hidden'>
              {chats.map((chat) => (
                <div
                  className='max-w-full cursor-default px-1 py-1.5'
                  key={chat.dirName}
                >
                  <div
                    className={cx(
                      'flex flex-col rounded-lg py-3 px-5 hover:bg-gray-100 hover:dark:bg-gray-600',
                      {
                        'bg-gray-100 dark:bg-gray-600':
                          folderName === chat.dirName,
                      }
                    )}
                    onClick={() => {
                      setFolderName(chat.dirName);
                    }}
                  >
                    <span className='mb-1 max-w-full overflow-hidden text-ellipsis whitespace-nowrap'>
                      {chat.title}
                    </span>
                    <small className='max-w-full overflow-hidden text-ellipsis text-gray-400'>
                      {chat.dirName}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          )}

          {chats.length === 0 && (
            <div className='flex h-full w-full select-none justify-center'>
              <div className='pt-6 text-gray-600 dark:text-gray-500'>
                No results
              </div>
            </div>
          )}
        </div>

        {/* Message boxes */}
        <div className='flex flex-1 flex-col'>
          <div className='flex w-full items-center justify-between border-b py-4 px-4 dark:border-gray-600'>
            <h3 className='select-none text-lg font-semibold'>
              {currentMessage
                ? decodeString(currentMessage.title)
                : 'Please select chat to view'}
            </h3>

            <button
              className='rounded-full border-none p-2 hover:bg-gray-100 hover:dark:bg-gray-600'
              onClick={toggleInfoPanel}
            >
              <InformationCircleIcon width={18} />
            </button>
          </div>

          <div className='flex flex-1 flex-col gap-5 overflow-y-auto break-all px-4 py-4'>
            {groupedMessages.map((messages, groupIdx) => {
              const sectionSenderName = decodeString(messages[0].sender_name);
              const color = randomColor({
                seed: sectionSenderName,
                luminosity: theme,
              });
              const isMe = sectionSenderName === myName;

              return (
                <div
                  className={cx('flex gap-2', {
                    'flex-row-reverse': isMe,
                  })}
                  key={groupIdx}
                >
                  {/* Avatar */}
                  {!isMe && (
                    <div className='flex flex-col items-center justify-end'>
                      <div
                        style={{
                          backgroundColor: color,
                        }}
                        className='h-8 w-8 rounded-full'
                      />
                    </div>
                  )}

                  {/* Messages */}
                  <div
                    className='item flex flex-col justify-between gap-0.5'
                    style={{
                      maxWidth: '65%',
                    }}
                  >
                    {!isMe && (
                      <small className='select-none pl-2 text-gray-400'>
                        {sectionSenderName}
                      </small>
                    )}

                    {messages.map((message, i) => {
                      const isFirst = i === 0;
                      const isLast = i === messages.length - 1;

                      return (
                        <MessageComponent
                          rootDir={directory!}
                          message={message}
                          key={`message_${message.sender_name}_${groupIdx}_${i}`}
                          isFirst={isFirst}
                          isLast={isLast}
                          isMe={isMe}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Info Panel */}
        {infoPanelOpen && currentMessage && (
          <div
            className='flex h-full w-full flex-col overflow-y-auto border-l py-4 px-4 dark:border-gray-600'
            style={{ maxWidth: 350 }}
          >
            <h3 className='mb-4 select-none text-center text-lg font-semibold'>
              {decodeString(currentMessage.title)}
            </h3>

            <Collapsible
              title='Chat Members'
              containerClassName='flex flex-col gap-4 py-4 px-5'
              isExpanded={chatMembersInfoExpanded}
              onToggle={toggleChatMembersInfo}
            >
              {currentMessage.participants.map((part) => {
                const color = randomColor({
                  seed: part.name,
                  luminosity: theme,
                });

                return (
                  <div className='flex gap-2' key={part.name}>
                    <div
                      style={{
                        backgroundColor: color,
                      }}
                      className='h-6 w-6 rounded-full'
                    />

                    <span className='text-base'>{decodeString(part.name)}</span>
                  </div>
                );
              })}
            </Collapsible>

            {chatStatistic && (
              <Collapsible
                title='Chat Information'
                containerClassName='flex flex-col gap-4 py-4 px-5'
                isExpanded={chatInfoExpanded}
                onToggle={toggleChatInfo}
              >
                <div className='flex justify-between'>
                  <span className='text-base font-medium'>Messages Count</span>

                  <span className='text-right text-base text-gray-500'>
                    {currentMessage.messages.length}
                  </span>
                </div>

                <div className='flex justify-between'>
                  <span className='text-base font-medium'>Members Count</span>

                  <span className='text-base text-gray-500'>
                    {currentMessage.participants.length}
                  </span>
                </div>

                <div className='flex justify-between'>
                  <span className='text-base font-medium'>Created At</span>

                  <span className='text-right text-base text-gray-500'>
                    {new Date(chatStatistic.createdAt).toLocaleString()}
                  </span>
                </div>
              </Collapsible>
            )}

            {chatStatistic && (
              <Collapsible
                title='Messages Count'
                isExpanded={messageCountExpanded}
                onToggle={toggleMessageCount}
                containerClassName='flex flex-col gap-4 py-4 px-5'
              >
                {Object.entries(chatStatistic.countInfo)
                  .sort(([, aCount], [, bCount]) => bCount - aCount)
                  .map(([senderName, count]) => (
                    <div key={senderName} className='flex justify-between'>
                      <span className='text-base'>
                        {decodeString(senderName)}
                      </span>

                      <span className='ml-2 text-base text-gray-500'>
                        {count}
                      </span>
                    </div>
                  ))}

                <div className='flex justify-between'>
                  <span className='text-base font-medium'>Total</span>

                  <span className='ml-2 text-base text-gray-500'>
                    {currentMessage.messages.length}
                  </span>
                </div>
              </Collapsible>
            )}
          </div>
        )}
      </div>
    );
  }
}

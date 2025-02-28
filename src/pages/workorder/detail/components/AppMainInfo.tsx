import { FeishuNotificationAPI, deleteFileByName, getFileUrl, uploadFile } from '@/api/platform';
import { updateWorkOrderDialogById, updateWorkOrderById } from '@/api/workorder';
import MyIcon from '@/components/Icon';
import Markdown from '@/components/Markdown';
import { useSelectFile } from '@/hooks/useSelectFile';
import { useToast } from '@/hooks/useToast';
import useSessionStore from '@/store/session';
import { WorkOrderDB, WorkOrderDialog, WorkOrderStatus } from '@/types/workorder';
import { isURL } from '@/utils/file';
import { formatTime } from '@/utils/tools';
import { Box, Button, Center, Flex, Icon, Image, Spinner, Text, Textarea } from '@chakra-ui/react';
import { keyframes } from '@chakra-ui/system';
import { fetchEventSource } from '@fortaine/fetch-event-source';
import { throttle } from 'lodash';
import { useTranslation } from 'next-i18next';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import FileSelectIcon from './FileSelectIcon';
import CommandTip from './CommandTip';
import useEnvStore from '@/store/env';
import { getLangStore } from '@/utils/cookieUtils';

const statusAnimation = keyframes`
  0% {
    opacity: 1;
  }

  100% {
    opacity: 0.11;
  }
`;
const textareaMinH = '50px';

const AppMainInfo = ({
  app,
  refetchWorkOrder,
  isManuallyHandled
}: {
  app: WorkOrderDB;
  refetchWorkOrder: () => void;
  isManuallyHandled: boolean;
}) => {
  const [isLoading, setIsloading] = useState(false);
  const { session } = useSessionStore();
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const { toast } = useToast();
  const [dialogs, setDialogs] = useState(app?.dialogs || []);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const messageBoxRef = useRef<HTMLDivElement>(null);
  const TextareaDom = useRef<HTMLTextAreaElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<
    {
      fileName: string;
      originalName: string;
      fileUrl: string;
    }[]
  >();

  const { File: FileSelector, onOpen: onOpenSelectFile } = useSelectFile({
    fileType: 'image/*',
    multiple: true
  });

  const removeFile = async (fileName: string) => {
    await deleteFileByName({ fileName: fileName });
    setUploadedFiles(
      (prevFiles) => prevFiles && prevFiles.filter((file) => file.fileName !== fileName)
    );
  };

  const uploadFiles = async (files: File[]) => {
    const form = new FormData();
    files.forEach((item) => {
      form.append('file', item, encodeURIComponent(item.name));
    });
    const temp = await uploadFile(form);
    setUploadedFiles(temp.map((i) => ({ ...i, fileUrl: '' })));

    const result = await Promise.all(
      temp.map(async (i) => {
        const fileUrl = await getFileUrl({ fileName: i.fileName });
        return {
          fileName: i.fileName,
          originalName: i.originalName,
          fileUrl: fileUrl
        };
      })
    );
    setUploadedFiles(result);
  };

  const handleSend = async () => {
    if (!session) return;
    const promises: Promise<any>[] = [];
    const temps: WorkOrderDialog[] = [];
    if (isChatLoading) {
      toast({
        status: 'info',
        title: t('please wait for the end')
      });
      return;
    }
    setIsChatLoading(true);
    try {
      if (uploadedFiles) {
        uploadedFiles.forEach((i) => {
          const temp: WorkOrderDialog = {
            time: new Date(),
            content: i.fileUrl,
            userId: session?.userId,
            isAdmin: session?.isAdmin,
            isAIBot: false
          };
          temps.push(temp);
          promises.push(
            updateWorkOrderDialogById({
              orderId: app.orderId,
              content: temp.content
            })
          );
        });
        setUploadedFiles(undefined);
      }
      if (text !== '') {
        const temp: WorkOrderDialog = {
          time: new Date(),
          content: text,
          userId: session?.userId,
          isAdmin: session?.isAdmin,
          isAIBot: false
        };
        temps.push(temp);
        promises.push(
          updateWorkOrderDialogById({
            orderId: app.orderId,
            content: temp.content
          })
        );
        setText('');
      }

      setDialogs((v) => [...v, ...temps]);
      await Promise.all(promises);
      if (text !== '' && !session?.isAdmin) {
        await triggerRobotReply();
      }
    } catch (error) {
      console.log(error);
      toast({ title: t('network anomaly'), status: 'error' });
      setDialogs((v) => v.slice(0, v.length - temps.length));
      setText('');
      setUploadedFiles(undefined);
    }
    setIsChatLoading(false);
  };

  const triggerRobotReply = async () => {
    let temp = '';
    setIsloading(true);
    try {
      if (!app.manualHandling.isManuallyHandled && !session?.isAdmin) {
        setDialogs((v) => {
          return [
            ...v,
            {
              time: new Date(),
              content: 'loading...',
              userId: 'robot',
              isAdmin: false,
              isAIBot: true
            }
          ];
        });
        await fetchEventSource('/api/ai/fastgpt', {
          method: 'POST',
          headers: {
            Authorization: useSessionStore.getState()?.session?.token || '',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            orderId: app.orderId
          }),
          openWhenHidden: true,
          onmessage: async ({ event, data }) => {
            if (data === '[DONE]') {
              return;
            }
            if (event === '[LIMIT]') {
              toast({ status: 'error', title: t('Request exceeds limit') });
              handleTransferToHuman();
              return;
            }
            if (event === 'error') {
              toast({ status: 'error', title: t('api is error') });
              return;
            }

            const json = JSON.parse(data);

            const text = json?.choices?.[0]?.delta?.content || '';
            temp += text;

            if (temp && temp !== '') {
              const updatedLastDialog = {
                time: new Date(),
                userId: 'robot',
                isAdmin: false,
                isAIBot: true,
                content: temp
              };
              setDialogs((prevDialogs) => {
                const lastDialog = prevDialogs[prevDialogs.length - 1];
                if (lastDialog && lastDialog.userId === 'robot') {
                  return [...prevDialogs.slice(0, -1), updatedLastDialog];
                } else {
                  return [...prevDialogs, updatedLastDialog];
                }
              });
            }
          },
          onerror(err) {
            console.log(err);
          }
        });

        if (temp !== '') {
          await updateWorkOrderDialogById({
            orderId: app.orderId,
            content: temp,
            isRobot: true
          });
        }
      }
    } catch (error) {
      console.log(error);
    }
    setIsloading(false);
  };

  const handleTransferToHuman = async () => {
    try {
      setIsloading(true);
      await FeishuNotificationAPI({
        type: app.type,
        description: app.description,
        orderId: app.orderId,
        switchToManual: true,
        level: app.userInfo.level
      });
      toast({
        title: t('Notification SwitchToManual Tips'),
        status: 'success'
      });
    } catch (error) {
      toast({
        title: t('network anomaly'),
        status: 'error'
      });
    }
    setIsloading(false);
    refetchWorkOrder();
  };

  const scrollToBottom = useRef(
    throttle(() => {
      const boxElement = messageBoxRef.current;
      if (boxElement) {
        requestAnimationFrame(() => {
          boxElement.scrollTop = boxElement.scrollHeight;
        });
      }
    }, 1000)
  ).current;

  useLayoutEffect(() => {
    scrollToBottom();
  }, [dialogs, scrollToBottom]);

  useEffect(() => {
    if (app?.dialogs?.every((dialog) => !dialog.isAdmin && !dialog.isAIBot)) {
      triggerRobotReply();
    }
  }, [app?.dialogs]);

  useEffect(() => {
    if (isManuallyHandled && app?.dialogs) {
      setDialogs(app?.dialogs);
    }
  }, [app?.dialogs, isManuallyHandled]);

  const disabled = useMemo(() => {
    return app?.status === WorkOrderStatus.Deleted || app?.status === WorkOrderStatus.Completed;
  }, []);

  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const files: File[] = [];

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          files.push(blob);
        }
      }
    }

    if (files.length > 0) {
      e.preventDefault();
      await uploadFiles(files);
    }
  }, []);

  const handleRecallMessage = async (index: number) => {
    try {
      setIsloading(true);
      await updateWorkOrderById({
        orderId: app.orderId,
        updates: {
          [`dialogs.${index}.isRecall`]: true
        }
      });
      setDialogs(
        dialogs.map((dialog, i) => (i === index ? { ...dialog, isRecall: true } : dialog))
      );
      toast({
        title: t('success'),
        status: 'success'
      });
    } catch (error) {
      toast({
        title: t('network anomaly'),
        status: 'error'
      });
    } finally {
      setIsloading(false);
    }
  };
  const { SystemEnv } = useEnvStore();
  const lang = useMemo(() => {
    return getLangStore() === 'en' ? 'en' : 'zh';
  }, []);

  return (
    <>
      <Text fontSize={'18px'} fontWeight={500} color={'#24282C'} mt="24px" ml="36px">
        {t('Order Conversation')}
      </Text>
      <Box
        id="messageBoxRef"
        ref={messageBoxRef}
        pl="71px"
        pr="64px"
        mt="24px"
        position={'relative'}
        flex={'1 0 0'}
        h="0"
        w="100%"
        overflow={'auto'}
        scrollBehavior={'smooth'}
      >
        {dialogs &&
          dialogs?.map((item, index) => {
            return (
              <Box key={item.time.toString() + index}>
                {index === 0 ||
                (dialogs?.[index - 1] &&
                  new Date(dialogs[index - 1].time).getTime() <
                    new Date(item.time).getTime() - 5 * 60 * 1000) ? (
                  <Flex
                    fontSize={'12px'}
                    fontWeight={400}
                    color={'#5A646E'}
                    justifyContent={'center'}
                  >
                    {formatTime(item.time, 'YYYY-MM-DD HH:mm')}
                  </Flex>
                ) : null}
                <Flex w="100%" gap="16px" mb="16px">
                  <Center
                    border={'1px solid #fdfdfe'}
                    w={'36px'}
                    h={'36px'}
                    bg={'#f2f5f7'}
                    borderRadius={'full'}
                    filter={
                      'drop-shadow(0px 0px 1px rgba(121, 141, 159, 0.25)) drop-shadow(0px 2px 4px rgba(161, 167, 179, 0.25))'
                    }
                  >
                    <MyIcon
                      width={'24px'}
                      name={
                        item.isAdmin ? 'sealosAvator' : item.isAIBot ? 'robot' : 'defaultAvator'
                      }
                      color={'#219BF4'}
                    />
                  </Center>

                  <Box flex={1} fontSize={'12px'} color={'#24282C'}>
                    <Box fontSize={'12px'} fontWeight={500}>
                      {item.isAdmin ? (
                        <Flex gap={'4px'}>
                          <Text>{SystemEnv.config?.adminName[lang]}</Text>
                          <Text color={'#7B838B'}>ID:{item.userId}</Text>
                        </Flex>
                      ) : item.isAIBot && isChatLoading ? (
                        <Box
                          animation={
                            isChatLoading && index === dialogs.length - 1
                              ? `${statusAnimation} 0.8s linear infinite alternate`
                              : ''
                          }
                        >
                          Robot
                        </Box>
                      ) : (
                        item.userId
                      )}
                    </Box>

                    <Box
                      position={'relative'}
                      mt="4px"
                      p="12px"
                      bg="#F6F8F9"
                      borderRadius={'4px'}
                      fontWeight={400}
                      role="group"
                    >
                      {item.isRecall ? (
                        <Text color="grayModern.500" fontSize="12px" fontStyle="italic">
                          {item.userId === session?.userId
                            ? t('you_recalled_a_message')
                            : item.isAdmin
                            ? t('user_recalled_a_message')
                            : t('user_recalled_a_message')}
                        </Text>
                      ) : (
                        <>
                          {item.userId === session?.userId && (
                            <Center
                              color={'grayModern.500'}
                              position={'absolute'}
                              right="8px"
                              top="8px"
                              cursor={'pointer'}
                              opacity={0}
                              _groupHover={{ opacity: 1 }}
                              _hover={{
                                bg: 'rgba(17, 24, 36, 0.05)'
                              }}
                              w={'20px'}
                              h={'20px'}
                              borderRadius={'4px'}
                              onClick={() => handleRecallMessage(index)}
                            >
                              <Icon
                                xmlns="http://www.w3.org/2000/svg"
                                width="14px"
                                height="14px"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M9 14 4 9l5-5" />
                                <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11" />
                              </Icon>
                            </Center>
                          )}
                          {isURL(item.content) ? (
                            item.content.match(/\.(jpg|jpeg|png|gif|bmp)/i) ? (
                              <Image alt="img" src={item.content} onLoad={() => scrollToBottom()} />
                            ) : (
                              <Box
                                as="a"
                                href={item.content}
                                target="_blank"
                                color="blue.500"
                                textDecoration="underline"
                              >
                                {item.content}
                              </Box>
                            )
                          ) : (
                            <Box fontWeight={400}>
                              <Markdown source={item.content} />
                            </Box>
                          )}
                        </>
                      )}
                    </Box>
                    {index === dialogs?.length - 1 &&
                      !session?.isAdmin &&
                      !app?.manualHandling?.isManuallyHandled && (
                        <Button
                          isLoading={isLoading}
                          h="28px"
                          onClick={handleTransferToHuman}
                          fontSize={'12px'}
                          mt={'4px'}
                        >
                          {t('Switch to manual')}
                        </Button>
                      )}
                  </Box>
                </Flex>
              </Box>
            );
          })}
      </Box>

      <Flex
        mx="71px"
        mb="24px"
        position={'relative'}
        px="12px"
        py="8px"
        borderRadius={'4px'}
        boxShadow={
          '0px 0px 1px 0px rgba(121, 141, 159, 0.25), 0px 2px 4px 0px rgba(161, 167, 179, 0.25)'
        }
        border={'1px solid #EAEBF0'}
        flexDirection={'column'}
        onPaste={handlePaste}
      >
        {uploadedFiles && (
          <Flex alignItems={'center'} gap={'4px'} wrap={'wrap'} mb={'4px'}>
            {uploadedFiles.map((file, index) => (
              <Flex
                flexShrink={'0'}
                height={'28px'}
                key={file.fileName}
                padding={'4px'}
                alignItems={'center'}
                gap={'4px'}
                fontSize={'12px'}
                fontWeight={'400'}
                color={'#24282C'}
                bg={'#F4F4F7'}
              >
                <Icon
                  xmlns="http://www.w3.org/2000/svg"
                  width="20px"
                  height="20px"
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <g clipPath="url(#clip0_192_9620)">
                    <path
                      d="M16.6667 2.5C17.1087 2.5 17.5326 2.67559 17.8452 2.98816C18.1577 3.30072 18.3333 3.72464 18.3333 4.16667V15.8333C18.3333 16.2754 18.1577 16.6993 17.8452 17.0118C17.5326 17.3244 17.1087 17.5 16.6667 17.5H3.33333C2.89131 17.5 2.46738 17.3244 2.15482 17.0118C1.84226 16.6993 1.66667 16.2754 1.66667 15.8333V4.16667C1.66667 3.72464 1.84226 3.30072 2.15482 2.98816C2.46738 2.67559 2.89131 2.5 3.33333 2.5H16.6667ZM16.6667 4.16667H3.33333V15.8333H4.1075L11.8642 8.07667C11.9609 7.97991 12.0757 7.90316 12.2021 7.85079C12.3285 7.79842 12.464 7.77147 12.6008 7.77147C12.7376 7.77147 12.8731 7.79842 12.9995 7.85079C13.1259 7.90316 13.2408 7.97991 13.3375 8.07667L16.6667 11.405V4.16667ZM12.6008 9.69667L6.46417 15.8333H16.6667V13.7625L12.6008 9.69667ZM6.25 5.83333C6.58152 5.83333 6.89946 5.96503 7.13388 6.19945C7.3683 6.43387 7.5 6.75181 7.5 7.08333C7.5 7.41485 7.3683 7.7328 7.13388 7.96722C6.89946 8.20164 6.58152 8.33333 6.25 8.33333C5.91848 8.33333 5.60054 8.20164 5.36612 7.96722C5.1317 7.7328 5 7.41485 5 7.08333C5 6.75181 5.1317 6.43387 5.36612 6.19945C5.60054 5.96503 5.91848 5.83333 6.25 5.83333Z"
                      fill="#47C8BF"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_192_9620">
                      <rect width="20" height="20" fill="white" />
                    </clipPath>
                  </defs>
                </Icon>
                <Text>{file.originalName}</Text>
                <Center
                  w={'20px'}
                  h={'20px'}
                  cursor={'pointer'}
                  onClick={() => removeFile(file.fileName)}
                >
                  {file.fileUrl ? (
                    <Icon
                      xmlns="http://www.w3.org/2000/svg"
                      width="12px"
                      height="12px"
                      viewBox="0 0 12 12"
                      fill="none"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M2.64645 2.64645C2.84171 2.45118 3.15829 2.45118 3.35355 2.64645L6 5.29289L8.64645 2.64645C8.84171 2.45118 9.15829 2.45118 9.35355 2.64645C9.54882 2.84171 9.54882 3.15829 9.35355 3.35355L6.70711 6L9.35355 8.64645C9.54882 8.84171 9.54882 9.15829 9.35355 9.35355C9.15829 9.54882 8.84171 9.54882 8.64645 9.35355L6 6.70711L3.35355 9.35355C3.15829 9.54882 2.84171 9.54882 2.64645 9.35355C2.45118 9.15829 2.45118 8.84171 2.64645 8.64645L5.29289 6L2.64645 3.35355C2.45118 3.15829 2.45118 2.84171 2.64645 2.64645Z"
                        fill="#485264"
                      />
                    </Icon>
                  ) : (
                    <Spinner size={'xs'} thickness="1px" />
                  )}
                </Center>
              </Flex>
            ))}
          </Flex>
        )}

        <Textarea
          ref={TextareaDom}
          placeholder={t('input_placeholder')}
          variant={'unstyled'}
          value={text}
          p={'0'}
          resize={'none'}
          maxH={'200px'}
          overflowWrap={'break-word'}
          overflowY={'auto'}
          _focusVisible={{
            border: 'none'
          }}
          disabled={disabled}
          whiteSpace={'pre-wrap'}
          onChange={(e) => {
            setText(e.target.value);
            e.target.style.height = textareaMinH;
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              handleSend();
            }
          }}
        />

        <Flex alignItems={'center'} alignSelf={'end'} h="28px" gap="20px">
          <CommandTip />
          <FileSelectIcon onOpenSelectFile={onOpenSelectFile} disable={disabled} />
          <Button
            variant={'primary'}
            w="71px"
            h="28px"
            borderRadius={'4px'}
            onClick={() => handleSend()}
            disabled={isLoading || (text === '' && !uploadFiles.length) || disabled}
            isLoading={isLoading}
          >
            {t('Send')}
          </Button>
        </Flex>

        <FileSelector onSelect={(e) => uploadFiles(e)} />
      </Flex>
    </>
  );
};

export default AppMainInfo;

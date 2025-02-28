import { createWorkOrder, updateWorkOrderDialogById } from '@/api/workorder';
import FileSelect, { FileItemType } from '@/components/FileSelect';
import MyIcon from '@/components/Icon';
import MySelect from '@/components/Select';
import { useConfirm } from '@/hooks/useConfirm';
import { useLoading } from '@/hooks/useLoading';
import { useToast } from '@/hooks/useToast';
import { WorkOrderDialog, WorkOrderEditForm } from '@/types/workorder';
import { Box, BoxProps, Center, Flex, Icon, Spinner, Text, Textarea } from '@chakra-ui/react';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { useCallback, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import ErrorModal from './components/ErrorModal';
import Header from './components/Header';
import { deleteFileByName, getFileUrl, uploadFile } from '@/api/platform';
import useSessionStore from '@/store/session';
import useEnvStore from '@/store/env';
import { getLangStore } from '@/utils/cookieUtils';

export default function EditOrder() {
  const [errorMessage, setErrorMessage] = useState('');
  const [files, setFiles] = useState<FileItemType[]>([]);
  const { t } = useTranslation();
  const { toast } = useToast();
  const { Loading, setIsLoading } = useLoading();
  const router = useRouter();
  const [forceUpdate, setForceUpdate] = useState(false);
  const { session } = useSessionStore();

  const { SystemEnv } = useEnvStore();

  const { openConfirm, ConfirmChild } = useConfirm({
    content: t('Are you sure you want to submit this work order')
  });

  // form
  const formHook = useForm<WorkOrderEditForm>({
    defaultValues: {
      type: SystemEnv.config?.workorder.type[0].id,
      description: ''
    }
  });

  // watch form change, compute new yaml
  formHook.watch(() => {
    setForceUpdate(!forceUpdate);
  });

  const [uploadedFiles, setUploadedFiles] = useState<
    {
      fileName: string;
      originalName: string;
      fileUrl: string;
    }[]
  >();

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

  const submitSuccess = async (data: WorkOrderEditForm) => {
    setIsLoading(true);
    try {
      if (!session?.token) {
        toast({
          title: 'session invalid',
          status: 'error'
        });
        setIsLoading(false);
        return;
      }
      const form = new FormData();
      files.forEach((item) => {
        form.append('file', item.file, encodeURIComponent(item.filename));
      });
      form.append('overwrite', 'false');
      const result = await uploadFile(form);
      const res = await createWorkOrder({
        type: data.type,
        files: uploadedFiles?.map((i) => i.fileUrl),
        description: data.description,
        appendix: result.map((i) => i.fileName),
        token: session?.token
      });
      toast({
        status: 'success',
        title: 'success'
      });
      router.push(`/workorder/detail?orderId=${res.orderId}`);
    } catch (error) {
      console.error(error);
      setErrorMessage(JSON.stringify(error));
    }
    setIsLoading(false);
  };

  const submitError = useCallback(() => {
    // deep search message
    const deepSearch = (obj: any): string => {
      if (!obj) return t('Submit Error');
      if (!!obj.message) {
        return obj.message;
      }
      return deepSearch(Object.values(obj)[0]);
    };

    toast({
      title: deepSearch(formHook.formState.errors),
      status: 'error',
      position: 'top',
      duration: 3000,
      isClosable: true
    });
  }, [formHook.formState.errors, t, toast]);

  const Label = ({
    children,
    w = 'auto',
    LabelStyle
  }: {
    children: string;
    w?: number | 'auto';
    LabelStyle?: BoxProps;
  }) => (
    <Box
      flex={`0 0 ${w === 'auto' ? 'auto' : `${w}px`}`}
      mx="2"
      {...LabelStyle}
      color={'#333'}
      userSelect={'none'}
    >
      {children}
    </Box>
  );

  const lang = useMemo(() => {
    return getLangStore() === 'en' ? 'en' : 'zh';
  }, []);

  const WorkOrderTypeList =
    SystemEnv.config?.workorder.type.map((item) => ({
      id: item.id,
      label: item.label[lang]
    })) ?? [];

  const removeFile = async (fileName: string) => {
    await deleteFileByName({ fileName: fileName });
    setUploadedFiles(
      (prevFiles) => prevFiles && prevFiles.filter((file) => file.fileName !== fileName)
    );
  };

  return (
    <Box
      flexDirection={'column'}
      alignItems={'center'}
      width={'100vw'}
      height={'100%'}
      minW={'910px'}
      bg={'#F3F4F5'}
    >
      <Header
        title="New Order"
        applyCb={() =>
          formHook.handleSubmit((data) => openConfirm(() => submitSuccess(data))(), submitError)()
        }
        applyBtnText="Submit Order"
      />
      <Flex h={'calc(100% - 126px)'} justifyContent={'center'} borderRadius={'4px'}>
        <Flex
          height={'100%'}
          bg="#FFF"
          minW={'782px'}
          borderRadius={'4px'}
          border={'1px solid #DEE0E2'}
          flexDirection={'column'}
        >
          <Flex alignItems={'center'} py="16px" px="42px" bg={'#F4F6F8'}>
            <MyIcon name="formInfo" w={'24px'}></MyIcon>
            <Text ml="12px" fontSize={'18px'} fontWeight={500} color={'#24282C'}>
              {t('Problem Description')}
            </Text>
          </Flex>
          <Box pt="24px" pl="42px" pb="64px" flex={1} h="0" overflow={'auto'}>
            <Flex alignItems={'center'} mt={'16px'}>
              <Label w={80}>{t('Type')}</Label>
              <MySelect
                width={'300px'}
                value={formHook.getValues('type')}
                list={WorkOrderTypeList}
                onchange={(val: any) => {
                  formHook.setValue('type', val);
                }}
              />
            </Flex>
            <Flex alignItems={'center'} mt={'16px'}>
              <Label
                w={80}
                LabelStyle={{
                  alignSelf: 'start'
                }}
              >
                {t('appendix')}
              </Label>
              <FileSelect
                w="300px"
                h="96px"
                fileExtension={'*'}
                files={files}
                setFiles={setFiles}
              />
            </Flex>
            <Flex alignItems={'center'} mt={'50px'} onPaste={handlePaste}>
              <Label
                w={80}
                LabelStyle={{
                  alignSelf: 'start'
                }}
              >
                {t('Description')}
              </Label>
              <Flex direction="column" w="full" mr="8">
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
                  mr="10%"
                  w="100%"
                  minH={'133px'}
                  placeholder={t('describe your problem') || ''}
                  {...formHook.register('description')}
                />
              </Flex>
            </Flex>
          </Box>
        </Flex>
      </Flex>
      <ConfirmChild />
      <Loading />
      {!!errorMessage && (
        <ErrorModal title={'Failed'} content={errorMessage} onClose={() => setErrorMessage('')} />
      )}
    </Box>
  );
}

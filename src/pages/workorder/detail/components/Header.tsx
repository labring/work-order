import { updateWorkOrderById } from '@/api/workorder';
import AppStatusTag from '@/components/AppStatusTag';
import MyIcon from '@/components/Icon';
import { useConfirm } from '@/hooks/useConfirm';
import { useToast } from '@/hooks/useToast';
import { useGlobalStore } from '@/store/global';
import { WorkOrderDB, WorkOrderStatus } from '@/types/workorder';
import { Box, Button, Flex } from '@chakra-ui/react';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { Dispatch, useCallback } from 'react';

const Header = ({
  app,
  isLargeScreen = true,
  setShowSlider
}: {
  app: WorkOrderDB;
  isLargeScreen: boolean;
  setShowSlider: Dispatch<boolean>;
}) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { toast } = useToast();

  const { ConfirmChild, openConfirm } = useConfirm({
    title: t('delete_confirm'),
    content: t('delete_confirm')
  });

  const { ConfirmChild: CloseConfirmChild, openConfirm: openCloseConfirm } = useConfirm({
    content: t('close_confirm'),
    title: t('close_confirm')
  });

  const handleWorkOrder = useCallback(
    async (id: string, method: 'delete' | 'close') => {
      try {
        await updateWorkOrderById({
          orderId: id,
          updates:
            method === 'delete'
              ? {
                  status: WorkOrderStatus.Deleted
                }
              : {
                  status: WorkOrderStatus.Completed
                }
        });
        toast({
          title: `success`,
          status: 'success'
        });
        router.push('/workorders');
      } catch (error) {}
    },
    [router, toast]
  );

  return (
    <Flex w={'100%'} h={'86px'} alignItems={'center'}>
      <Flex
        alignItems={'center'}
        cursor={'pointer'}
        onClick={() => {
          router.push({
            pathname: '/workorders',
            query: {
              page: router.query?.page,
              status: router.query?.status
            }
          });
        }}
      >
        <MyIcon name="arrowLeft" />
        <Box ml={6} fontWeight={'bold'} color={'black'} fontSize={'20px'} mr="16px">
          {t('Order Detail')}
        </Box>
        {app?.status && <AppStatusTag status={app?.status} showBorder={false} />}
      </Flex>
      <Box flex={1}></Box>
      {!isLargeScreen && (
        <Box mx={4}>
          <Button
            flex={1}
            h={'40px'}
            borderColor={'myGray.200'}
            leftIcon={<MyIcon name="detail" w="16px" h="16px" />}
            variant={'base'}
            bg={'white'}
            onClick={() => setShowSlider(true)}
          >
            {t('Details')}
          </Button>
        </Box>
      )}
      {app.status !== WorkOrderStatus.Completed && app.status !== WorkOrderStatus.Deleted && (
        <Button
          _focusVisible={{ boxShadow: '' }}
          mr={5}
          h={'40px'}
          borderColor={'myGray.200'}
          leftIcon={<MyIcon name={'close'} w={'16px'} />}
          variant={'base'}
          bg={'white'}
          onClick={() => openCloseConfirm(() => handleWorkOrder(app.orderId, 'close'))()}
        >
          {t('Close')}
        </Button>
      )}
      <Button
        h={'40px'}
        borderColor={'myGray.200'}
        leftIcon={<MyIcon name="delete" w={'16px'} />}
        variant={'base'}
        bg={'white'}
        _hover={{
          color: '#FF324A'
        }}
        onClick={() => openConfirm(() => handleWorkOrder(app.orderId, 'delete'))()}
      >
        {t('Delete')}
      </Button>
      <ConfirmChild />
      <CloseConfirmChild />
    </Flex>
  );
};

export default Header;

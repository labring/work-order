import { getWorkOrderList } from '@/api/workorder';
import MyIcon from '@/components/Icon';
import Pagination from '@/components/Pagination';
import MySelect from '@/components/Select';
import SelectDateRange from '@/components/SelectDateRange';
import Tabs from '@/components/Tabs';
import { WorkOrderStatus } from '@/types/workorder';
import { serviceSideProps } from '@/utils/i18n';
import { Box, Button, Flex, Image, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'next-i18next';
import { useEffect, useMemo, useState } from 'react';
import List from './components/List';
import useSessionStore from '@/store/session';
import { useRouter } from 'next/router';
import useEnvStore from '@/store/env';
import { getLangStore } from '@/utils/cookieUtils';

function Home() {
  const { SystemEnv } = useEnvStore();
  const { t } = useTranslation();
  const router = useRouter();
  const [page, setPage] = useState(() => {
    const queryPage = Number(router.query.page);
    return !isNaN(queryPage) && queryPage > 0 ? queryPage : 1;
  });
  const [pageSize, setPageSize] = useState(10);
  const [orderStatus, setOrderStatus] = useState<WorkOrderStatus>(
    (router.query?.status as WorkOrderStatus) || WorkOrderStatus.All
  );

  const [orderType, setOrderType] = useState<string>('');
  const [userLevel, setUserLevel] = useState<string>('');

  const [startTime, setStartTime] = useState(() => {
    const currentDate = new Date();
    currentDate.setMonth(currentDate.getMonth() - 1);
    return currentDate;
  });
  const [endTime, setEndTime] = useState(new Date());
  const { session, authUser } = useSessionStore();

  useEffect(() => {
    if (typeof router.query.token === 'string') authUser(router.query.token);
  }, [String(router.query.token)]);

  const { data, refetch } = useQuery(
    ['getWorkOrderList', page, pageSize, orderStatus, orderType, startTime, endTime, userLevel],
    () =>
      getWorkOrderList({
        page,
        pageSize,
        orderStatus,
        orderType,
        level: Number(userLevel),
        startTime,
        endTime
      }),
    {
      enabled: !!session,
      refetchInterval: 6000
    }
  );

  const lang = useMemo(() => {
    return getLangStore() === 'en' ? 'en' : 'zh';
  }, []);

  const WorkorderTypeList =
    SystemEnv.config?.workorder.type.map((item) => ({
      id: item.id,
      label: item.label[lang]
    })) ?? [];

  const UserLevelList =
    SystemEnv.config?.userlevel.map((item, index) => ({
      id: String(index),
      label: item.label[lang]
    })) ?? [];

  return (
    <Flex
      flexDirection={'column'}
      bg={'#F3F4F5'}
      px={'32px'}
      h="100%"
      minW={'1024px'}
      overflow={'auto'}
    >
      <Flex flexShrink={0} h={'88px'} alignItems={'center'}>
        <Box mr={4} p={2} bg={'#FEFEFE'} borderRadius={'4px'} border={'1px solid #DEE0E2'}>
          <Image alt="logo" src="/logo.svg" w="24px" h="24px"></Image>
        </Box>
        <Box fontSize={'18px'} color={'black'} fontWeight={'bold'}>
          {t('Order List')}
        </Box>
        <Box ml={3} color={'gray.500'}>
          ({data?.totalCount})
        </Box>
        <Box flex={1}></Box>
        {!session?.isAdmin && (
          <Button
            variant={'primary'}
            w="156px"
            h="42px"
            leftIcon={<MyIcon name={'plus'} w={'12px'} />}
            onClick={() => router.push('/workorder/create')}
          >
            {t('New Order')}
          </Button>
        )}
      </Flex>

      <Flex
        fontSize={'12px'}
        color={'#24282C'}
        fontWeight={400}
        alignItems={'center'}
        mb="14px"
        position={'relative'}
      >
        <Tabs
          fontSize={'12px'}
          borderRadius={'4px'}
          bg="#F6F8F9"
          border={'1px solid #EAEBF0'}
          list={
            session?.isAdmin
              ? [
                  { id: 'all', label: 'All' },
                  { id: 'pending', label: 'Pending' },
                  { id: 'processing', label: 'Processing' },
                  { id: 'completed', label: 'Completed' },
                  { id: 'deleted', label: 'Deleted' }
                ]
              : [
                  { id: 'all', label: 'All' },
                  { id: 'pending', label: 'Pending' },
                  { id: 'processing', label: 'Processing' },
                  { id: 'completed', label: 'Completed' }
                ]
          }
          activeId={orderStatus}
          onChange={(id: any) => {
            router.push({
              query: {
                status: id
              }
            });
            setPage(1);
            setOrderStatus(id);
          }}
        />
        <Text ml="32px" mr="12px">
          {t('Create Time')}
        </Text>
        <SelectDateRange
          startTime={startTime}
          setStartTime={setStartTime}
          endTime={endTime}
          setEndTime={setEndTime}
        />
        <Text ml="32px" mr="12px">
          {t('Question Type')}
        </Text>
        <MySelect
          fontSize={'12px'}
          width={'110px'}
          height={'32px'}
          value={orderType}
          list={[{ id: '', label: 'All' }].concat(WorkorderTypeList)}
          onchange={(val: any) => {
            setPage(1);
            setOrderType(val);
          }}
        />
        {session?.isAdmin && (
          <>
            <Text ml="32px" mr="12px">
              {t('user_level')}
            </Text>

            <MySelect
              fontSize={'12px'}
              width={'110px'}
              height={'32px'}
              value={userLevel}
              list={[{ id: '', label: 'All' }].concat(UserLevelList)}
              onchange={(val: any) => {
                console.log(val);
                setPage(1);
                setUserLevel(val);
              }}
            />
          </>
        )}
      </Flex>

      {data?.orders && data?.orders?.length > 0 ? (
        <Box flex={'1 0 0'}>
          <List refetchApps={refetch} apps={data?.orders} />
        </Box>
      ) : (
        <Flex alignItems={'center'} justifyContent={'center'} flexDirection={'column'} flex={1}>
          <MyIcon name={'noEvents'} color={'transparent'} width={'80px'} height={'80px'} />
          <Box py={8}>{t('Order Empty')}</Box>
        </Flex>
      )}

      {!!data?.totalCount && (
        <Pagination
          totalItems={data?.totalCount || 0}
          itemsPerPage={pageSize}
          currentPage={page}
          setCurrentPage={(page) => {
            router.push({
              query: {
                ...router.query,
                page: page.toString()
              }
            });
            setPage(page);
          }}
        />
      )}
    </Flex>
  );
}

export async function getServerSideProps(content: any) {
  return {
    props: {
      ...(await serviceSideProps(content))
    }
  };
}
export default Home;

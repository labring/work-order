import { Flex, Icon, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

const CommandTip = () => {
  const { t } = useTranslation();

  return (
    <Flex alignItems={'center'} gap={'4px'} color={'rgb(153, 153, 153)'} fontSize={'12px'}>
      <Icon
        xmlns="http://www.w3.org/2000/svg"
        width="12px"
        height="12px"
        viewBox="0 0 24 24"
        fill="transparent"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="9 10 4 15 9 20"></polyline>
        <path d="M20 4v7a4 4 0 0 1-4 4H4"></path>
      </Icon>
      <Text>{t('send')}</Text>
      <Text>/</Text>
      <Flex alignItems={'center'}>
        <Icon
          fill={'rgb(153, 153, 153)'}
          height="12px"
          width="12px"
          viewBox="0 0 32 32"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="m21 28h-10a2.0023 2.0023 0 0 1 -2-2v-10h-5a1 1 0 0 1 -.707-1.707l12-12a.9994.9994 0 0 1 1.414 0l12 12a1 1 0 0 1 -.707 1.707h-5v10a2.0027 2.0027 0 0 1 -2 2zm-14.5859-14h4.5859v12h10v-12h4.5859l-9.5859-9.5859z" />
          <path d="m0 0h32v32h-32z" fill="none" />
        </Icon>
        <Icon
          xmlns="http://www.w3.org/2000/svg"
          width="12px"
          height="12px"
          viewBox="0 0 24 24"
          fill="transparent"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="9 10 4 15 9 20"></polyline>
          <path d="M20 4v7a4 4 0 0 1-4 4H4"></path>
        </Icon>
      </Flex>
      <Text>{t('newline')}</Text>
    </Flex>
  );
};

export default CommandTip;

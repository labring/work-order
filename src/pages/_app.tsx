import { theme } from '@/constants/theme';
import { useGlobalStore } from '@/store/global';
import '@/styles/reset.scss';
import { getLangStore } from '@/utils/cookieUtils';
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { throttle } from 'lodash';
import { appWithTranslation, useTranslation } from 'next-i18next';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import Router, { useRouter } from 'next/router';
import NProgress from 'nprogress'; //nprogress module
import 'nprogress/nprogress.css';
import { useEffect } from 'react';
import 'react-day-picker/dist/style.css';
//Binding events.
Router.events.on('routeChangeStart', () => NProgress.start());
Router.events.on('routeChangeComplete', () => NProgress.done());
Router.events.on('routeChangeError', () => NProgress.done());

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      cacheTime: 0
    }
  }
});

function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const { i18n } = useTranslation();
  const { setScreenWidth, setLastRoute } = useGlobalStore();

  // add resize event
  useEffect(() => {
    const resize = throttle((e: Event) => {
      const documentWidth = document.documentElement.clientWidth || document.body.clientWidth;
      setScreenWidth(documentWidth);
    }, 200);
    window.addEventListener('resize', resize);
    const documentWidth = document.documentElement.clientWidth || document.body.clientWidth;
    setScreenWidth(documentWidth);

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, [setScreenWidth]);

  // init
  // useEffect(() => {
  //   const changeI18n = async (data: any) => {
  //     const lastLang = getLangStore();
  //     const newLang = data.currentLanguage;
  //     if (lastLang !== newLang) {
  //       i18n?.changeLanguage?.(newLang);
  //       setLangStore(newLang);
  //       setRefresh((state) => !state);
  //     }
  //   };
  //
  //   (async () => {
  //     try {
  //       const lang = await sealosApp.getLanguage();
  //       changeI18n({
  //         currentLanguage: lang.lng
  //       });
  //     } catch (error) {
  //       changeI18n({
  //         currentLanguage: 'zh'
  //       });
  //     }
  //   })();
  // }, []);

  // record route
  useEffect(() => {
    return () => {
      setLastRoute(router.asPath);
    };
  }, [router.asPath, setLastRoute]);

  useEffect(() => {
    const lang = getLangStore() || 'zh';
    i18n?.changeLanguage?.(lang);
  }, [i18n, router.asPath]);

  return (
    <>
      <Head>
        <title>FastGPT Workorder</title>
        <meta name="description" content="Generated by FasGPT & Sealos Team" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <QueryClientProvider client={queryClient}>
        <ChakraProvider theme={theme}>
          <Component {...pageProps} />
          {/* <ConfirmChild /> */}
        </ChakraProvider>
      </QueryClientProvider>
    </>
  );
}

export default appWithTranslation(App);

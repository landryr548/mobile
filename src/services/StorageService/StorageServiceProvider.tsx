import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import AsyncStorage from '@react-native-community/async-storage';
import {I18nContext} from '@shopify/react-i18n';
import {DevSettings} from 'react-native';

import {StorageService} from './StorageService';

const StorageServiceContext = createContext<StorageService | undefined>(undefined);

export interface StorageServiceProviderProps {
  children?: React.ReactElement;
}

export const StorageServiceProvider = ({children}: StorageServiceProviderProps) => {
  const storageService = useMemo(() => new StorageService(), []);
  const [ready, setReady] = useState(false);

  useEffect(() => storageService.ready.observe(setReady), [storageService]);

  return <StorageServiceContext.Provider value={storageService}>{ready && children}</StorageServiceContext.Provider>;
};

export const useStorage = () => {
  const storageService = useContext(StorageServiceContext)!;
  const i18nManager = React.useContext(I18nContext);

  const [isOnboarding, setIsOnboarding] = useState(storageService.isOnboarding.value);
  const setOnboarded = useMemo(() => storageService.setOnboarded, [storageService.setOnboarded]);

  const [locale, setLocaleInternal] = useState(storageService.locale.value);
  const setLocale = useMemo(
    () => (newLocale: string) => {
      storageService.setLocale(newLocale);
      if (i18nManager && newLocale && newLocale !== i18nManager.details.locale) i18nManager.update({locale: newLocale});
    },
    [storageService, i18nManager],
  );

  const [region, setRegionInternal] = useState(storageService.region.value);
  const setRegion = useMemo(() => storageService.setRegion, [storageService.setRegion]);

  useEffect(() => storageService.isOnboarding.observe(setIsOnboarding), [storageService.isOnboarding]);
  useEffect(() => storageService.locale.observe(setLocaleInternal), [storageService.locale]);
  useEffect(() => storageService.region.observe(setRegionInternal), [storageService.region]);

  const reset = useCallback(async () => {
    setOnboarded(false);
    setLocale('en');
    setRegion(undefined);
    await AsyncStorage.clear();
    if (__DEV__) {
      DevSettings.reload('Reset app');
    }
  }, [setLocale, setOnboarded, setRegion]);

  return useMemo(
    () => ({
      isOnboarding,
      setOnboarded,
      locale,
      setLocale,
      region,
      setRegion,
      reset,
    }),
    [isOnboarding, locale, region, reset, setLocale, setOnboarded, setRegion],
  );
};

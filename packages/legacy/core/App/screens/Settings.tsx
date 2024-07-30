import { StackScreenProps } from '@react-navigation/stack'
import React, { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import { getVersion, getBuildNumber } from 'react-native-device-info'
import { SafeAreaView } from 'react-native-safe-area-context'

import HeaderButton, { ButtonLocation } from '../components/buttons/HeaderButton'
import { useConfiguration } from '../contexts/configuration'
import { DispatchAction } from '../contexts/reducers/store'
import { useStore } from '../contexts/store'
import { useTheme } from '../contexts/theme'
import { Locales } from '../localization'
import { GenericFn } from '../types/fn'
import { Screens, SettingStackParams, Stacks } from '../types/navigators'
import { SettingIcon, SettingSection } from '../types/settings'
import { testIdWithKey } from '../utils/testable'

type SettingsProps = StackScreenProps<SettingStackParams>

const touchCountToEnableBiometrics = 9

const Settings: React.FC<SettingsProps> = ({ navigation }) => {
  const { t, i18n } = useTranslation()
  const [store, dispatch] = useStore()
  const developerOptionCount = useRef(0)
  const { SettingsTheme, TextTheme, ColorPallet, Assets } = useTheme()
  const { settings, enableTours, enablePushNotifications } = useConfiguration()
  const styles = StyleSheet.create({
    container: {
      backgroundColor: ColorPallet.brand.primaryBackground,
      width: '100%',
    },
    section: {
      // backgroundColor: SettingsTheme.groupBackground,
      backgroundColor: SettingsTheme.modalSecondary, // *ACS* white bkg
      paddingVertical: 24,
      flexGrow: 1,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingBottom: 0,
      marginBottom: -11,
      paddingHorizontal: 25,
    },
    sectionSeparator: {
      marginBottom: 10,
    },
    sectionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexGrow: 1,
      paddingHorizontal: 25,
    },
    itemSeparator: {
      borderBottomWidth: 2, // *ACS* changed from 1
      borderBottomColor: ColorPallet.brand.secondaryBackground,
      marginHorizontal: 25,
    },
    footer: {
      marginVertical: 25,
      alignItems: 'center',
    },
  })

  const currentLanguage = i18n.t('Language.code', { context: i18n.language as Locales })
  const incrementDeveloperMenuCounter = () => {
    if (developerOptionCount.current >= touchCountToEnableBiometrics) {
      developerOptionCount.current = 0
      dispatch({
        type: DispatchAction.ENABLE_DEVELOPER_MODE,
        payload: [true],
      })

      return
    }

    developerOptionCount.current = developerOptionCount.current + 1
  }

  const settingsSections: SettingSection[] = [
    {
      header: {
        icon: { name: '' },
        title: ' ',
      },
      data: [
        // {
        //   title: t('Screens.NameWallet'),
        //   value: store.preferences.walletName ? store.preferences.walletName : undefined,
        //   accessibilityLabel: t('Screens.NameWallet'),
        //   testID: testIdWithKey('NameWallet'),
        //   onPress: () => navigation.navigate(Screens.NameWallet),
        // },
        {
          title: t('Global.Biometrics'),
          value: store.preferences.useBiometry ? t('Global.On') : t('Global.Off'),
          accessibilityLabel: t('Global.Biometrics'),
          testID: testIdWithKey('Biometrics'),
          onPress: () => navigation.navigate(Screens.UseBiometry),
        },
        {
          title: t('Settings.ChangePin'),
          value: undefined,
          accessibilityLabel: t('Settings.ChangePin'),
          testID: testIdWithKey('Change Pin'),
          onPress: () =>
            navigation
              .getParent()
              ?.navigate(Stacks.SettingStack, { screen: Screens.CreatePIN, params: { updatePin: true } }),
        },
        {
          title: t('Settings.Language'),
          value: currentLanguage,
          accessibilityLabel: t('Settings.Language'),
          testID: testIdWithKey('Language'),
          onPress: () => navigation.navigate(Screens.Language),
        },
      ],
    },
    ...(settings || []),
  ]

  // add optional push notifications menu to settings
  if (enablePushNotifications) {
    settingsSections
      .find((item) => item.header.title === t('Settings.AppSettings'))
      ?.data.push({
        title: t('Settings.Notifications'),
        value: undefined,
        accessibilityLabel: t('Settings.Notifications'),
        testID: testIdWithKey('Notifications'),
        onPress: () =>
          navigation
            .getParent()
            ?.navigate(Stacks.SettingStack, { screen: Screens.UsePushNotifications, params: { isMenu: true } }),
      })
  }

  // add optional history menu to settings
  if (store.preferences.useHistoryCapability) {
    settingsSections
      .find((item) => item.header.title === t('Settings.AppSettings'))
      ?.data.push({
        title: t('Global.History'),
        value: undefined,
        accessibilityLabel: t('Global.History'),
        testID: testIdWithKey('History'),
        onPress: () => navigation.navigate(Screens.HistorySettings),
      })
  }

  if (enableTours) {
    const section = settingsSections.find((item) => item.header.title === t('Settings.AppSettings'))
    if (section) {
      section.data = [
        ...section.data,
        {
          title: t('Settings.AppGuides'),
          value: store.tours.enableTours ? t('Global.On') : t('Global.Off'),
          accessibilityLabel: t('Settings.AppGuides'),
          testID: testIdWithKey('AppGuides'),
          onPress: () => navigation.navigate(Screens.Tours),
        },
      ]
    }
  }

  if (store.preferences.developerModeEnabled) {
    const section = settingsSections.find((item) => item.header.title === t('Settings.AppSettings'))
    if (section) {
      section.data = [
        ...section.data,
        {
          title: t('Settings.Developer'),
          accessibilityLabel: t('Settings.Developer'),
          testID: testIdWithKey('DeveloperOptions'),
          onPress: () => navigation.navigate(Screens.Developer),
        },
      ]
    }
  }

  if (store.preferences.useVerifierCapability) {
    settingsSections.splice(1, 0, {
      header: {
        icon: { name: 'send' },
        title: t('Screens.ProofRequests'),
      },
      data: [
        {
          title: t('Screens.SendProofRequest'),
          accessibilityLabel: t('Screens.ProofRequests'),
          testID: testIdWithKey('ProofRequests'),
          onPress: () =>
            navigation.getParent()?.navigate(Stacks.ProofRequestsStack, {
              screen: Screens.ProofRequests,
              params: { navigation: navigation },
            }),
        },
      ],
    })

    const section = settingsSections.find((item) => item.header.title === t('Settings.AppSettings'))
    if (section) {
      section.data.splice(3, 0, {
        title: t('Settings.DataRetention'),
        value: store.preferences.useDataRetention ? t('Global.On') : t('Global.Off'),
        accessibilityLabel: t('Settings.DataRetention'),
        testID: testIdWithKey('DataRetention'),
        onPress: () => navigation.navigate(Screens.DataRetention),
      })
    }
  }

  if (store.preferences.useConnectionInviterCapability) {
    const section = settingsSections.find((item) => item.header.title === store.preferences.walletName)
    if (section) {
      section.data.splice(1, 0, {
        title: t('Settings.ScanMyQR'),
        accessibilityLabel: t('Settings.ScanMyQR'),
        testID: testIdWithKey('ScanMyQR'),
        onPress: () =>
          navigation.getParent()?.navigate(Stacks.ConnectStack, {
            screen: Screens.Scan,
            params: { defaultToConnect: true },
          }),
      })
    }
  }

  const SectionHeader: React.FC<{
    // icon: SettingIcon
    iconRight?: SettingIcon
    title: string
    titleTestID?: string
  }> = ({ iconRight, title, titleTestID }) =>
    // gate keep behind developer mode
    store.preferences.useConnectionInviterCapability ? (
      <View style={[styles.section, styles.sectionHeader, { justifyContent: iconRight ? 'space-between' : undefined }]}>
        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
          {/* <Icon
              importantForAccessibility={'no-hide-descendants'}
              accessible={false}
              name={icon.name}
              size={icon.size ?? defaultIconSize}
              style={[{ marginRight: 10, color: SettingsTheme.iconColor }, icon.style]}
            /> */}
          <Text
            testID={titleTestID}
            numberOfLines={1}
            accessibilityRole={'header'}
            style={[TextTheme.headingThree, { flexShrink: 1 }]}
          >
            {title}
          </Text>
        </View>
        {iconRight && (
          <HeaderButton
            buttonLocation={ButtonLocation.Right}
            accessibilityLabel={iconRight.accessibilityLabel!}
            testID={iconRight.testID!}
            onPress={iconRight.action!}
            icon={'pencil'}
            iconTintColor={TextTheme.headingThree.color}
          />
        )}
      </View>
    ) : (
      <View style={[styles.section, styles.sectionHeader]}>
        {/* <Icon
              importantForAccessibility={'no-hide-descendants'}
              accessible={false}
              name={icon.name}
              size={24}
              style={{ marginRight: 10, color: SettingsTheme.iconColor }}
            /> */}
        <Text accessibilityRole={'header'} style={[TextTheme.headingThree, { flexShrink: 1 }]}>
          {title}
        </Text>
      </View>
    )

  const SectionRow: React.FC<{
    title: string
    value?: string
    accessibilityLabel?: string
    testID?: string
    onPress?: GenericFn
  }> = ({ title, value, accessibilityLabel, testID, onPress }) => (
    <ScrollView horizontal style={styles.section} contentContainerStyle={{ flexGrow: 1 }}>
      <TouchableOpacity
        accessible={true}
        accessibilityLabel={accessibilityLabel}
        testID={testID}
        style={styles.sectionRow}
        onPress={onPress}
      >
        <Text style={[TextTheme.settingsText, { marginRight: 14 }]}>{title}</Text>
        <Text style={[TextTheme.settingsText, { color: ColorPallet.brand.link }]}>{value}</Text>
      </TouchableOpacity>
    </ScrollView>
  )

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <SectionList
        renderItem={({ item: { title, value, accessibilityLabel, testID, onPress } }) => (
          <SectionRow
            title={title}
            accessibilityLabel={accessibilityLabel}
            testID={testID ?? 'NoTestIdFound'}
            value={value}
            onPress={onPress}
          />
        )}
        renderSectionHeader={({
          section: {
            header: { title, iconRight, titleTestID },
          },
        }) => <SectionHeader iconRight={iconRight} title={title} titleTestID={titleTestID} />}
        ItemSeparatorComponent={() => (
          <View style={{ backgroundColor: SettingsTheme.groupBackground }}>
            <View style={[styles.itemSeparator]}></View>
          </View>
        )}
        SectionSeparatorComponent={() => <View style={[styles.sectionSeparator]}></View>}
        ListFooterComponent={() => (
          <View style={styles.footer}>
            <TouchableWithoutFeedback
              onPress={incrementDeveloperMenuCounter}
              disabled={store.preferences.developerModeEnabled}
            >
              <View>
                {/* *ACS* - changed to DigiCred logo, and some formatting of text */}
                <Assets.svg.logo style={{ alignSelf: 'center' }} width={150} height={75} />
                <Text style={TextTheme.normal} testID={testIdWithKey('Version')}>
                  {`${t('Settings.Version')} ${getVersion()}  -  ${t('Settings.Build')} ${getBuildNumber()}\n`}
                </Text>
              </View>
            </TouchableWithoutFeedback>
          </View>
        )}
        sections={settingsSections}
        stickySectionHeadersEnabled={false}
      ></SectionList>
    </SafeAreaView>
  )
}

export default Settings

import { render } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import AppTabs from '@/components/app-tabs';

jest.mock('expo-router/native-tabs', () => {
  const React = require('react');
  const { View } = require('react-native');

  const Trigger = Object.assign(
    ({ children, name }: PropsWithChildren<{ name: string }>) =>
      React.createElement(View, { testID: `native-tab-${name}` }, children),
    {
      Label({ children }: PropsWithChildren) {
        const { Text } = require('react-native');
        return React.createElement(Text, null, children);
      },
      Icon() {
        return null;
      },
    },
  );

  const NativeTabs = Object.assign(
    ({ children }: PropsWithChildren) => React.createElement(React.Fragment, null, children),
    { Trigger },
  );

  return { NativeTabs };
});

describe('water container navigation', () => {
  test('exposes the container route in native tabs', async () => {
    const tabs = await render(<AppTabs />);

    expect(tabs.getByTestId('native-tab-index')).toBeOnTheScreen();
    expect(tabs.getByTestId('native-tab-explore')).toBeOnTheScreen();
    expect(tabs.getByTestId('native-tab-history')).toBeOnTheScreen();
    expect(tabs.getByTestId('native-tab-container')).toBeOnTheScreen();
    expect(tabs.getByText('Depósito')).toBeOnTheScreen();
  });
});

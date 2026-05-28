import { Redirect } from 'expo-router';

// Entry point — always go straight to reels
export default function Index() {
  return <Redirect href="/reels" />;
}

import { useRouter } from 'next/router';
import Head from 'next/head';
import InviteComponent from '../../components/invite';
import React from 'react';

export default function Convite() {
  const router = useRouter();
  const { token } = router.query;

  return (
    <>
      <Head>
        <html lang="pt-BR" />
        <title>Convite - Smart Invite</title>
        <meta name="description" content="Seu convite personalizado" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <InviteComponent token={token} />
    </>
  );
}
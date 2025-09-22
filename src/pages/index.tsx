import Head from 'next/head';
import HomeComponent from '../components/home';
import React from 'react';

export default function Home() {
  return (
    <>
      <Head>
        <html lang="pt-BR" />
        <title>Smart Invite - Gerador de Convites</title>
        <meta name="description" content="Crie convites personalizados para seus eventos" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <HomeComponent />
    </>
  );
}
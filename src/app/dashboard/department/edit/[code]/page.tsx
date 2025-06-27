import EditPage from '@pages/EditPage';
import React from 'react';

interface EditApplicationProps {
  params: { code: string };
}

export default async function EditApplication({ params }: EditApplicationProps) {
  const {code } = await params;
  return <EditPage code={code} />;
}

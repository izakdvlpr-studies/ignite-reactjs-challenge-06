/* eslint-disable consistent-return */
/* eslint-disable @typescript-eslint/explicit-function-return-type */

import { NextApiRequest, NextApiResponse } from 'next';

import Prismic from '@prismicio/client';
import { DefaultClient } from '@prismicio/client/types/client';

import { Document } from '@prismicio/client/types/documents';

function linkResolver(doc: Document): string {
  if (doc.type === 'posts') {
    return `/post/${doc.uid}`;
  }

  return '/';
}

function createClientOptions(req = null, prismicAccessToken = null) {
  const reqOption = req ? { req } : {};

  const accessTokenOption = prismicAccessToken
    ? { accessToken: prismicAccessToken }
    : {};

  return {
    ...reqOption,
    ...accessTokenOption,
  };
}

function Client(req = null): DefaultClient {
  return Prismic.client(
    process.env.PRISMIC_API_ENDPOINT,
    createClientOptions(req, process.env.PRIMISC_ACCESS_TOKEN)
  );
}

interface PreviewQuery {
  token: string;
  documentId: string;
}

export default async function preview(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  const { token: ref, documentId } = (req.query as unknown) as PreviewQuery;

  const redirectUrl = await Client(req)
    .getPreviewResolver(ref, documentId)
    .resolve(linkResolver, '/');

  if (!redirectUrl) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  res.setPreviewData({ ref });
  res.writeHead(302, { Location: `${redirectUrl}` });
  res.end();
}

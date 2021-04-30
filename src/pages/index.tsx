import { useState } from 'react';

import { GetStaticProps } from 'next';
import Link from 'next/link';

import Prismic from '@prismicio/client';

import { FiCalendar, FiUser } from 'react-icons/fi';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { getPrismicClient } from '../services/prismic';

import Header from '../components/Header';

import commonStyles from '../styles/common.module.scss';

import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
  preview: boolean;
}

export default function Home({
  postsPagination,
  preview,
}: HomeProps): JSX.Element {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [postsNextPage, setPostsNextPage] = useState(postsPagination.next_page);

  async function handleLoadMore(): Promise<void> {
    const postsResponse = await fetch(
      postsPagination.next_page
    ).then(response => response.json());

    const newPosts = postsResponse.results.map(post => ({
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    }));

    setPosts([...posts, ...newPosts]);
    setPostsNextPage(postsResponse.next_page);
  }

  return (
    <>
      <Header />

      <main className={`${commonStyles.content} ${styles.container}`}>
        <div className={styles.posts}>
          {posts.map((post, index) => (
            <Link key={String(index)} href={`/post/${post.uid}`}>
              <a>
                <h1>{post.data.title}</h1>

                <p>{post.data.subtitle}</p>

                <div className={styles.postInfo}>
                  <time>
                    <FiCalendar size={20} />{' '}
                    <span>
                      {format(
                        new Date(post.first_publication_date),
                        'dd MMM yyyy',
                        {
                          locale: ptBR,
                        }
                      )}
                    </span>
                  </time>

                  <div>
                    <FiUser size={20} /> <span>{post.data.author}</span>
                  </div>
                </div>
              </a>
            </Link>
          ))}
        </div>

        {postsNextPage && (
          <button
            type="button"
            className={styles.button}
            onClick={handleLoadMore}
          >
            Carregar mais posts
          </button>
        )}

        {preview && (
          <aside className={styles.exitPreviewMode}>
            <Link href="/api/exit-preview">
              <a>Sair do modo Preview</a>
            </Link>
          </aside>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();

  const response = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 2,
      ref: previewData?.ref ?? null,
    }
  );

  const results = response.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return {
    props: {
      postsPagination: {
        next_page: response.next_page,
        results,
      },
      preview,
    },
  };
};

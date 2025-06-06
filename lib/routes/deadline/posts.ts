import { Route } from '@/types';

import got from '@/utils/got';
import { load } from 'cheerio';
import { parseDate } from '@/utils/parse-date';
import { art } from '@/utils/render';
import path from 'node:path';

export const route: Route = {
    path: '/',
    radar: [
        {
            source: ['deadline.com/'],
            target: '',
        },
    ],
    name: 'Unknown',
    maintainers: ['TonyRL'],
    handler,
    url: 'deadline.com/',
};

async function handler(ctx) {
    const baseUrl = 'https://deadline.com';
    const response = await got(`${baseUrl}/wp-json/wp/v2/posts`, {
        searchParams: {
            per_page: ctx.req.query('limit') ?? 30,
            _embed: true,
        },
    });

    const items = response.data.map((item) => {
        const embedded = item._embedded;
        const $ = load(item.content.rendered, null, false);

        $('.c-lazy-image__img').each((_, img) => {
            img = $(img);
            if (img.attr('data-lazy-src')) {
                img.attr('src', img.attr('data-lazy-src').split('?')[0]);
                img.removeAttr('data-lazy-src');
                img.removeAttr('data-lazy-srcset');
            }
        });
        $('[class^="lrv-a-crop-"]').contents().unwrap();

        const description = art(path.join(__dirname, 'templates/desc.art'), {
            desc: $.html(),
            embedded,
        });
        return {
            title: item.title.rendered,
            link: item.link,
            guid: item.guid.rendered,
            description,
            pubDate: parseDate(item.date_gmt),
            author: embedded.author[0].name,
            category: [...new Set([...embedded['wp:term'][0].map((i) => i.name), ...embedded['wp:term'][1].map((i) => i.name)])],
        };
    });

    return {
        title: 'Deadline – Hollywood Entertainment Breaking News',
        description: 'Deadline.com is always the first to break up-to-the-minute entertainment, Hollywood and media news, with an unfiltered, no-holds-barred analysis of events.',
        link: baseUrl,
        language: 'en-US',
        image: `${baseUrl}/wp-content/themes/pmc-deadline-2019/assets/app/icons/apple-touch-icon.png`,
        item: items,
    };
}

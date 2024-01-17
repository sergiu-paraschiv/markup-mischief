window.MarkupMischief = {
    spritesRelativePath: './'
};


require.config({
    paths: {
        'react': './lib/react.production.min',
        'react-dom': './lib/react-dom.production.min',
        'antd': './lib/antd.min',
        '@ant-design/icons': './lib/antd-icons.umd.min',
        'dayjs': './lib/dayjs.min'
    },
    map: {
        '*': {
            'react-dom/client': 'react-dom',
            'React': 'react'
        }
    },
    urlArgs: 'v=' + new Date().getTime()
});

require([ 'main' ]);

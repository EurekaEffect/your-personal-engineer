module.exports = {
    entry: './src/Main.ts',
    output: {
        path: __dirname + '/output',
        filename: 'ype.bundle.user.js',
        publicPath: __dirname
    },
    resolve: {
        extensions: ['.ts', '.js', '.json']
    },
    module: {
        rules: [{
            test: /\.ts$/,
            exclude: /node_modules/,
            use: {
                loader: 'ts-loader',
            }
        }]
    }
};
const express = require('express')
const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
const multer = require('multer');
const upload = multer({ dest: __dirname });
const SCOPES = ['https://www.googleapis.com/auth/drive'];
const TOKEN_PATH = 'token.json';


const app = express()
app.use(express.static('public'));
const PORT = process.env.PORT || 3000
app.post('/upload', upload.single('photo'), (req, res) => {
    // fs.readFile('drive.json', (err, content) => {
    //     if (err) return console.log('Error loading client secret file:', err);
    //     // Authorize a client with credentials, then call the Google Drive API.
    //     authorize(JSON.parse(content), upload);
    // });
    authorize()

    /**
     * Create an OAuth2 client with the given credentials, and then execute the
     * given callback function.
     * @param {Object} credentials The authorization client credentials.
     * @param {function} callback The callback to call with the authorized client.
     */
    function authorize() {
        const client_secret = "f2X-KqvnX4UD2ByOvRxzevHS"
        const client_id = "391107498186-ebu5kgs34ma2r70b5h8gdmkup618rmfk.apps.googleusercontent.com"
        const redirect_uris = "http://localhost/drive/"
        const oAuth2Client = new google.auth.OAuth2(
            client_id, client_secret, redirect_uris);

        // Check if we have previously stored a token.
        fs.readFile(TOKEN_PATH, (err, token) => {
            if (err) return getAccessToken(oAuth2Client, upload);
            oAuth2Client.setCredentials(JSON.parse(token));
            upload(oAuth2Client);
        });
    }
    function getAccessToken(oAuth2Client, callback) {
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
        });
        console.log('Authorize this app by visiting this url:', authUrl);
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        rl.question('Enter the code from that page here: ', (code) => {
            rl.close();
            oAuth2Client.getToken(code, (err, token) => {
                if (err) return console.error('Error retrieving access token', err);
                oAuth2Client.setCredentials(token);
                // Store the token to disk for later program executions
                fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                    if (err) return console.error(err);
                    console.log('Token stored to', TOKEN_PATH);
                });
                callback(oAuth2Client);
            });
        });
    }
    function upload(auth) {
        const { originalname, mimetype, path } = req.file
        const drive = google.drive({ version: 'v3', auth });
        var fileMetadata = {
            'name': originalname
        };
        var media = {
            mimeType: mimetype,
            body: fs.createReadStream(path)
        };
        drive.files.create({
            resource: fileMetadata,
            media: media
        }, function (err, file) {
            if (err) {
                // Handle error
                console.error(err);
            } else {
                console.log('File Id: ', file);
                res.json(file.data)
            }
        });
    }
    function listFiles(auth) {
        const drive = google.drive({ version: 'v3', auth });
        drive.files.list({
            pageSize: 10,
            fields: 'nextPageToken, files(id, name)',
        }, (err, res) => {
            if (err) return console.log('The API returned an error: ' + err);
            const files = res.data.files;
            if (files.length) {
                console.log('Files:');
                files.map((file) => {
                    console.log(`${file.name} (${file.id})`);
                });
            } else {
                console.log('No files found.');
            }
        });
    }

})
app.listen(PORT, () => { console.log(`App started on port ${PORT}`) })

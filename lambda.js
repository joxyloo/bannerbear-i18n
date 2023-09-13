const aws = require('aws-sdk');
const https = require('https');

const s3 = new aws.S3({ apiVersion: '2006-03-01' });

exports.handler = async (event, context) => {
    // Get the object from the event and show its content type
    const bucket = event.Records[0].s3.bucket.name; 
    const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
    const params = {
        Bucket: bucket,
        Key: key,
    }; 
    try {
        const { ContentType } = await s3.headObject(params).promise();
        console.log('CONTENT TYPE:', ContentType);
        
        if (bucket === 'banner-localization' && ContentType === "application/json") {
            
            // generate image with Bannerbear
            const response = await s3.getObject(params).promise();
            const jsonObj = JSON.parse(response.Body.toString('utf-8'))
            const localizedImg = await generateImage(jsonObj);
            console.log(localizedImg);
            
            // upload to the "banner-localization-output" folder
            await uploadImg(localizedImg);
        }
         
        return ContentType;
    } catch (err) {
        console.log(err);
        const message = `Error getting object ${key} from bucket ${bucket}. Make sure they exist and your bucket is in the same region as this function.`;
        console.log(message);
        throw new Error(message);
    }
};


async function generateImage(jsonObj) {
    
    var imgObj = [];
    const fileName = jsonObj.file_name;
    
    for (const lang in jsonObj.translation) {
        
        const data = {
            "template" : jsonObj.template_id,
            "modifications" : []
        }
        
        // prepare data
        for (const vrb in jsonObj.translation[lang]) {
            data.modifications.push({
                "name": vrb,
                "text": jsonObj.translation[lang][vrb]
            })
        }
        
        const postData = JSON.stringify(data);
        const options = {
            protocol: 'https:',
            hostname: 'sync.api.bannerbear.com',
            port: 443,
            method: 'POST',
            path: '/v2/images',
            headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jsonObj.api_key}`
            }
        };
        var res = await makeHttpPostRequest(options, postData);
        var imgUrl = res.image_url_jpg;
        
        imgObj.push({
            "lang": lang,
            "img_url": imgUrl,
            "file_name": `${fileName.split('.')[0]}-${lang}.${fileName.split('.')[1]}`
        })
    }
    return imgObj;
}

async function uploadImg(localizedImg) {
    
    for (const index in localizedImg) {
        const imageBuffer = await makeHttpGetRequest(localizedImg[index].img_url);
        const params_upload = {
            Body: imageBuffer, 
            Bucket: "banner-localization-output", 
            Key: localizedImg[index].file_name,
            ContentType: "image/jpeg"
         };
        const upload_res = await s3.putObject(params_upload, function(err, data) {
          if (err) console.log(err, err.stack); // an error occurred
          else     console.log('successful');   // successful response
         }).promise();
        
    }
    
}

function makeHttpPostRequest(options, postData) {
    
    return new Promise((resolve, reject) => {
        const req = https.request(options, res => {
          var rawData = '';
        
          res.on('data', chunk => {
            rawData += chunk;
          });
        
          res.on('end', () => {
            try {
              resolve(JSON.parse(rawData));
            } catch (err) {
              reject(new Error(err));
            }
          });
        });
        
        req.on('error', err => {
          reject(new Error(err));
        });
        
        req.write(JSON.stringify(postData));
        req.end();
    });
}

function makeHttpGetRequest(url) {

  return new Promise((resolve, reject) => {
    const req = https.get(url, res => {
      var rawData = [];

      res.on('data', chunk => {
        rawData.push(chunk);
      });

      res.on('end', () => {
        try {
          resolve(Buffer.concat(rawData));
        } catch (err) {
          reject(new Error(err));
        }
      });
    });

    req.on('error', err => {
      reject(new Error(err));
    });
  });
}
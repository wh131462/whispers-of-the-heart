const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

async function testSimpleUpload() {
  try {
    // 创建一个测试文件
    const testContent = 'This is a simple test file for upload';
    fs.writeFileSync('./simple-test.txt', testContent);
    
    // 创建FormData
    const formData = new FormData();
    formData.append('file', fs.createReadStream('./simple-test.txt'));
    formData.append('folderId', 'root');
    formData.append('tags', JSON.stringify(['test', 'simple']));
    formData.append('description', 'Simple test upload');
    formData.append('isPublic', 'true');
    
    console.log('Testing simple file upload...');
    console.log('FormData fields:');
    console.log('- file: simple-test.txt');
    console.log('- folderId: root');
    console.log('- tags:', JSON.stringify(['test', 'simple']));
    console.log('- description: Simple test upload');
    console.log('- isPublic: true');
    
    // 发送请求（不需要认证token进行测试）
    const response = await axios.post('http://localhost:7777/api/v1/file-management/files/upload', formData, {
      headers: {
        ...formData.getHeaders()
      },
      timeout: 10000
    });
    
    console.log('Upload response:', response.data);
    
    // 清理测试文件
    fs.unlinkSync('./simple-test.txt');
    
  } catch (error) {
    console.error('Upload error:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    }
  }
}

testSimpleUpload();

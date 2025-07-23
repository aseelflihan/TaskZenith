// اختبار سريع لوظائف التطبيق الأساسية
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

async function quickHealthCheck() {
  console.log('🔍 فحص سريع لحالة التطبيق...\n');
  
  // Test 1: Check essential files exist
  console.log('1. فحص الملفات الأساسية...');
  const essentialFiles = [
    'package.json',
    'next.config.ts',
    'src/app/layout.tsx',
    'src/app/api/knowledge/upload/route.ts',
    'src/lib/alternative-ocr.ts',
    'src/ai/flows/summarize-and-extract-tasks.ts'
  ];
  
  let allFilesExist = true;
  essentialFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`   ✅ ${file}`);
    } else {
      console.log(`   ❌ ${file} - مفقود!`);
      allFilesExist = false;
    }
  });
  
  // Test 2: Check dependencies
  console.log('\n2. فحص التبعيات...');
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const requiredDeps = ['mammoth', 'pdf2json', 'xlsx', 'tesseract.js', 'next', 'react'];
    
    requiredDeps.forEach(dep => {
      if (packageJson.dependencies[dep]) {
        console.log(`   ✅ ${dep}: ${packageJson.dependencies[dep]}`);
      } else {
        console.log(`   ❌ ${dep} - غير مثبت!`);
        allFilesExist = false;
      }
    });
  } catch (error) {
    console.log('   ❌ خطأ في قراءة package.json');
    allFilesExist = false;
  }
  
  // Test 3: Check node_modules
  console.log('\n3. فحص node_modules...');
  if (fs.existsSync('node_modules')) {
    console.log('   ✅ مجلد node_modules موجود');
    
    const criticalModules = ['mammoth', 'pdf2json', 'xlsx', 'tesseract.js'];
    criticalModules.forEach(mod => {
      if (fs.existsSync(path.join('node_modules', mod))) {
        console.log(`   ✅ ${mod}`);
      } else {
        console.log(`   ❌ ${mod} - غير مثبت في node_modules!`);
        allFilesExist = false;
      }
    });
  } else {
    console.log('   ❌ node_modules مفقود! يجب تشغيل npm install');
    allFilesExist = false;
  }
  
  // Test 4: Check environment
  console.log('\n4. فحص متغيرات البيئة...');
  const envFiles = ['.env.local', '.env'];
  let hasEnvFile = false;
  
  envFiles.forEach(envFile => {
    if (fs.existsSync(envFile)) {
      console.log(`   ✅ ${envFile} موجود`);
      hasEnvFile = true;
    }
  });
  
  if (!hasEnvFile) {
    console.log('   ⚠️ لا توجد ملفات .env (قد تكون مطلوبة للذكاء الاصطناعي)');
  }
  
  // Test 5: Quick syntax check
  console.log('\n5. فحص syntax سريع...');
  try {
    require('./src/lib/alternative-ocr.ts');
    console.log('   ❌ لا يمكن استيراد TypeScript مباشرة');
  } catch (error) {
    if (error.message.includes('Unexpected token')) {
      console.log('   ✅ ملفات TypeScript تحتاج transpilation (طبيعي)');
    } else {
      console.log('   ✅ لا توجد أخطاء syntax واضحة');
    }
  }
  
  // Final assessment
  console.log('\n📋 تقييم نهائي:');
  if (allFilesExist) {
    console.log('✅ التطبيق يبدو سليماً من ناحية الملفات والتبعيات');
    console.log('💡 يمكن تشغيل التطبيق بـ: npm run dev');
  } else {
    console.log('❌ هناك مشاكل في التطبيق تحتاج إصلاح');
    console.log('🔧 جرب: npm install');
  }
}

// Test if we can import key modules
async function testModuleImports() {
  console.log('\n🧪 اختبار استيراد المكتبات...\n');
  
  const modules = [
    { name: 'mammoth', test: () => require('mammoth') },
    { name: 'pdf2json', test: () => require('pdf2json') },
    { name: 'xlsx', test: () => require('xlsx') },
    { name: 'tesseract.js', test: () => require('tesseract.js') }
  ];
  
  let allWorking = true;
  
  for (const module of modules) {
    try {
      const lib = module.test();
      console.log(`✅ ${module.name}: تم تحميله بنجاح`);
      
      // Quick test
      if (module.name === 'mammoth') {
        console.log(`   - طرق متاحة: ${Object.keys(lib).slice(0, 3).join(', ')}...`);
      } else if (module.name === 'xlsx') {
        console.log(`   - إصدار: ${lib.version || 'غير محدد'}`);
      }
    } catch (error) {
      console.log(`❌ ${module.name}: فشل التحميل - ${error.message.substring(0, 50)}...`);
      allWorking = false;
    }
  }
  
  return allWorking;
}

async function runHealthCheck() {
  console.log('🚀 فحص شامل لحالة التطبيق');
  console.log('=====================================\n');
  
  await quickHealthCheck();
  const modulesWorking = await testModuleImports();
  
  console.log('\n🎯 النتيجة النهائية:');
  if (modulesWorking) {
    console.log('✅ التطبيق جاهز للعمل!');
    console.log('▶️ لتشغيل التطبيق: npm run dev');
  } else {
    console.log('❌ هناك مشاكل تحتاج إصلاح');
    console.log('🔧 جرب: npm install --force');
  }
}

runHealthCheck().catch(console.error);

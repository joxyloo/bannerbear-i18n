import logo from './logo.svg';
import './App.css';
import { useTranslation, Trans } from 'react-i18next';

const lngs = {
  en: { nativeName: 'English' },
  de: { nativeName: 'Deutsch' },
  // cn: { nativeName: '中文' }
};

function App() {
  const { t, i18n } = useTranslation();
  const imgUrl =
  'https://ondemand.bannerbear.com/simpleurl/ea36j9B13YakMJlwrq/image/title/text/thynk 500X/' +
  '/tag/text/' + t('limited_edition') +
  '/pretitle/text/' + t('all_new') +
  '/CTA/text/' + t('buy_now');
  return (
    <div className='App'>
      <header className='App-header'>
        {/* <img src={logo} className='App-logo' alt='logo' /> */}
        <img src={`https://banner-localization-output.s3.ap-southeast-1.amazonaws.com/promo_banner-${i18n.resolvedLanguage}.jpg`} className='banner' alt="banner image" />
        <div>
          {Object.keys(lngs).map((lng) => (
            <button
              key={lng}
              style={{ fontWeight: i18n.resolvedLanguage === lng ? 'bold' : 'normal' }}
              type='submit'
              onClick={() => {i18n.changeLanguage(lng); console.log(i18n.resolvedLanguage);}}
            >
              {lngs[lng].nativeName}
            </button>
          ))}
        </div>
        <p>
          <Trans i18nKey='description.part1'>
            Edit <code>src/App.js</code> and save to reload.
          </Trans>
        </p>
        <a className='App-link' href='https://reactjs.org' target='_blank' rel='noopener noreferrer'>
          {t('description.part2')}
        </a>
      </header>
    </div>
  );
}

export default App;

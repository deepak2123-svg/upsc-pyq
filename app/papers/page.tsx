import type {Metadata} from 'next';
import {SiteHeader} from '../components/site-header';
import {PaperPracticeWorkspace} from '../components/paper-practice-workspace';
import {getPaperPracticeRows,getPaperPracticeYears} from '../../lib/paper-practice-catalog';
export const metadata:Metadata={title:'Practice Official Papers',description:'Practice one or more exact UPSC previous papers.'};
export default function PapersPage(){return <><SiteHeader/><PaperPracticeWorkspace rows={getPaperPracticeRows()} years={getPaperPracticeYears()}/></>}

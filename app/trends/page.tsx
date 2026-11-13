import type {Metadata} from 'next';
import {SiteHeader} from '../components/site-header';
import {TrendsWorkspace} from '../components/trends-workspace';
import {getTrendQuestions} from '../../lib/trends-catalog';

export const metadata:Metadata={title:'PYQ Trends',description:'Explore UPSC PYQ topic and subtopic frequency by exam, paper, year and term.'};
export default function TrendsPage(){return <><SiteHeader/><TrendsWorkspace questions={getTrendQuestions()}/></>}

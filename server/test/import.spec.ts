import StylableDotCompletionProvider, { Completion, snippet, ExtendedResolver, ProviderPosition, ProviderRange } from '../src/provider'
import { Resolver, Stylesheet } from 'stylable'
import * as _ from 'lodash';
import { expect } from "chai";
import { TestResolver } from '../test-kit/test-resolver';
import {assertCompletions, assertNoCompletions} from '../test-kit/asserters';

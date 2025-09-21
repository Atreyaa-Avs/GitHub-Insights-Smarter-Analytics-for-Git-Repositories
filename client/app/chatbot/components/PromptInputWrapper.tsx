import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputButton,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import { ChevronUp, GlobeIcon, MicIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

interface Model {
  id: string;
  name: string;
}

interface CompanyModels {
  company: string;
  models: Model[];
}

interface Props {
  text: string;
  setText: (value: string) => void;
  model: string;
  setModel: (value: string) => void;
  useMicrophone: boolean;
  setUseMicrophone: (value: boolean) => void;
  useWebSearch: boolean;
  setUseWebSearch: (value: boolean) => void;
  handleSubmit: (msg: any) => void;
  status: any;
  models: CompanyModels[];
}

const PromptInputWrapper = ({
  text,
  setText,
  model,
  setModel,
  useMicrophone,
  setUseMicrophone,
  useWebSearch,
  setUseWebSearch,
  handleSubmit,
  status,
  models,
}: Props) => {
  return (
    <PromptInput onSubmit={handleSubmit} className='max-2xl:max-w-2xl max-2xl:mx-auto' globalDrop multiple>
      <PromptInputBody className=''>
        <PromptInputAttachments>
          {(attachment) => <PromptInputAttachment data={attachment} />}
        </PromptInputAttachments>
        <PromptInputTextarea
          onChange={(e) => setText(e.target.value)}
          value={text}
        />
      </PromptInputBody>

      <PromptInputToolbar>
        <PromptInputTools>
          {/* Attachments */}
          <PromptInputActionMenu>
            <PromptInputActionMenuTrigger />
            <PromptInputActionMenuContent>
              <PromptInputActionAddAttachments />
            </PromptInputActionMenuContent>
          </PromptInputActionMenu>

          {/* Mic button */}
          <PromptInputButton
            onClick={() => setUseMicrophone(!useMicrophone)}
            variant={useMicrophone ? 'default' : 'ghost'}
          >
            <MicIcon size={16} />
            <span className="sr-only">Microphone</span>
          </PromptInputButton>

          {/* Web search button */}
          <PromptInputButton
            onClick={() => setUseWebSearch(!useWebSearch)}
            variant={useWebSearch ? 'default' : 'ghost'}
          >
            <GlobeIcon size={16} />
            <span>Search</span>
          </PromptInputButton>

          {/* Nested model dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="px-3 py-2 text-xs 2xl:text-sm border rounded-md">
              <div className='flex items-center'>
                {models
                  .flatMap((c) => c.models)
                  .find((m) => m.id === model)?.name || 'Select Model'}
                <ChevronUp  className="ml-2 h-4 w-4" />
              </div>
            </DropdownMenuTrigger>

            <DropdownMenuContent>
              {models.map((company) => (
                <DropdownMenuSub key={company.company}>
                  <DropdownMenuSubTrigger className='text-xs 2xl:text-sm'>{company.company}</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {company.models.map((m) => (
                      <DropdownMenuItem
                        key={m.id}
                        onSelect={() => setModel(m.id)}
                        className='text-xs 2xl:text-sm'
                      >
                        {m.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </PromptInputTools>

        <PromptInputSubmit disabled={!text && !status} status={status} />
      </PromptInputToolbar>
    </PromptInput>
  );
};

export default PromptInputWrapper;
